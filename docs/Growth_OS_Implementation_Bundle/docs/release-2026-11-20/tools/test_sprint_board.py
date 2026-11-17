import json
from pathlib import Path
import tempfile
import threading
import unittest

from sprint_board import Board, BoardError


SHA = 'a' * 40


class BoardTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        self.repo = self.root / 'repo'
        self.repo.mkdir()
        (self.repo / 'test.log').write_text('meaningful verification output\n')
        self.db = self.root / 'sprint.sqlite'
        self.now = 1000.0
        self.board = Board(self.db, lambda: self.now)

    def tearDown(self):
        self.board.close()
        self.tmp.cleanup()

    def init(self, tasks=None):
        return self.board.init(tasks or [{'id': 'A', 'role': 'code', 'resources': ['server.ts']}], self.repo)

    def submit(self, task='A', worker='author'):
        return self.board.submit(task, worker, SHA, ['test.log'])

    def receipt(self, commit=SHA, **kwargs):
        proof = {'commit': commit, 'command': 'npm run verify', 'exit_code': 0, 'evidence': ['test.log']}
        proof.update(kwargs)
        (self.repo / 'verify.json').write_text(json.dumps(proof))
        return 'verify.json'

    def test_concurrent_claim_is_exclusive(self):
        self.init()
        barrier = threading.Barrier(2)
        results, errors = [], []

        def worker(name):
            board = Board(self.db, lambda: self.now)
            try:
                barrier.wait(timeout=5)
                results.append(board.claim(name, 'code'))
            except Exception as error:
                errors.append(error)
            finally:
                board.close()

        threads = [threading.Thread(target=worker, args=(name,)) for name in ['one', 'two']]
        for thread in threads:
            thread.start()
        for thread in threads:
            thread.join(timeout=10)
        self.assertFalse(any(thread.is_alive() for thread in threads))
        self.assertEqual(errors, [])
        self.assertEqual(sum(result is not None for result in results), 1)
        self.assertEqual(self.board.status()[0]['attempts'], 1)

    def test_dependencies_wait_for_integration(self):
        self.init([
            {'id': 'A', 'role': 'code'},
            {'id': 'B', 'role': 'code', 'depends_on': ['A']},
        ])
        self.assertEqual([t['id'] for t in self.board.ready()], ['A'])
        self.board.claim('author', 'code')
        self.submit()
        self.assertEqual(self.board.ready(), [])
        self.board.review('A', 'reviewer', True, 'Acceptance inspected')
        self.assertEqual(self.board.ready(), [])
        self.board.integrate('A', 'lead', 'integrator', self.receipt())
        self.assertEqual([t['id'] for t in self.board.ready()], ['B'])

    def test_resources_remain_locked_through_review(self):
        self.init([
            {'id': 'A', 'role': 'code', 'resources': ['server.ts']},
            {'id': 'B', 'role': 'code', 'resources': ['server.ts']},
            {'id': 'C', 'role': 'design', 'resources': ['Layout.tsx']},
        ])
        self.board.claim('author', 'code', 'A')
        self.assertIsNone(self.board.claim('other', 'code', 'B'))
        self.assertEqual(self.board.claim('designer', 'design')['id'], 'C')
        self.submit()
        self.assertIsNone(self.board.claim('other', 'code', 'B'))
        self.board.review('A', 'reviewer', True, 'Acceptance inspected')
        self.assertIsNone(self.board.claim('other', 'code', 'B'))
        self.board.integrate('A', 'lead', 'integrator', self.receipt())
        self.assertEqual(self.board.claim('other', 'code', 'B')['id'], 'B')

    def test_expired_claim_blocks_and_retains_resources(self):
        self.init([
            {'id': 'A', 'role': 'code', 'resources': ['server.ts']},
            {'id': 'B', 'role': 'code', 'resources': ['server.ts']},
        ])
        self.board.claim('author', 'code', 'A', lease_minutes=1)
        self.now += 61
        self.assertEqual(self.board.ready(), [])
        self.assertEqual(self.board.status()[0]['state'], 'blocked')
        self.assertIsNone(self.board.claim('other', 'code'))
        with self.assertRaises(BoardError):
            self.submit()
        self.board.reconcile('A', 'lead', 'integrator', 'retry', 'Confirmed worker stopped; worktree inspected')
        self.assertEqual(self.board.claim('author', 'code', 'A')['attempts'], 2)
        self.now += 1801
        self.board.status()
        self.board.reconcile('A', 'lead', 'integrator', 'retry', 'Second failed lease; inspected')
        self.assertEqual(self.board.status()[0]['state'], 'escalated')

    def test_author_cannot_review_and_failures_escalate(self):
        self.init()
        self.board.claim('author', 'code')
        self.submit()
        with self.assertRaises(BoardError):
            self.board.review('A', 'author', True, 'Self review')
        self.board.review('A', 'reviewer', False, 'Acceptance failed')
        self.assertEqual(self.board.status()[0]['state'], 'pending')
        self.board.claim('author', 'code')
        self.submit()
        self.board.review('A', 'reviewer', False, 'Acceptance failed again')
        row = self.board.status()[0]
        self.assertEqual((row['state'], row['failures'], row['attempts']), ('escalated', 2, 2))
        self.assertIsNone(self.board.claim('author', 'code'))

    def test_evidence_must_exist_inside_repo_including_symlinks(self):
        self.init()
        self.board.claim('author', 'code')
        outside = self.root / 'outside.log'
        outside.write_text('not allowed')
        (self.repo / 'escape.log').symlink_to(outside)
        for ref in ['missing.log', '../outside.log', 'escape.log']:
            with self.subTest(ref=ref), self.assertRaises(BoardError):
                self.board.submit('A', 'author', SHA, [ref])
        self.assertEqual(self.board.status()[0]['state'], 'claimed')

    def test_receipt_requires_exact_commit_verify_and_existing_logs(self):
        self.init()
        self.board.claim('author', 'code')
        self.submit()
        self.board.review('A', 'reviewer', True, 'Evidence inspected')
        with self.assertRaises(BoardError):
            self.board.integrate('A', 'lead', 'code', self.receipt())
        invalid = [
            {'commit': 'b' * 40},
            {'command': 'npm test'},
            {'exit_code': 1},
            {'exit_code': False},
            {'evidence': ['missing.log']},
        ]
        for fields in invalid:
            with self.subTest(fields=fields), self.assertRaises(BoardError):
                self.board.integrate('A', 'lead', 'integrator', self.receipt(**fields))
        self.assertEqual(self.board.status()[0]['state'], 'reviewed')
        self.assertEqual(self.board.integrate('A', 'lead', 'integrator', self.receipt())['state'], 'integrated')

    def test_owner_role_and_heartbeat(self):
        self.init([
            {'id': 'A', 'role': 'code'},
            {'id': 'B', 'role': 'code'},
        ])
        self.assertIsNone(self.board.claim('wrong', 'design'))
        self.board.claim('author', 'code', 'A', lease_minutes=1)
        with self.assertRaises(BoardError):
            self.board.claim('author', 'code', 'B')
        with self.assertRaises(BoardError):
            self.board.heartbeat('A', 'other')
        self.now += 30
        result = self.board.heartbeat('A', 'author')
        self.assertEqual(result['lease'], self.now + 1800)
        self.now += 40
        self.assertEqual(self.board.status()[0]['state'], 'claimed')

    def test_invalid_graph_rejected_without_partial_state(self):
        for tasks in [
            [{'id': 'A', 'role': 'code', 'depends_on': ['missing']}],
            [{'id': 'A', 'role': 'code', 'depends_on': ['A']}],
            [{'id': 'A', 'role': 'code'}, {'id': 'A', 'role': 'code'}],
        ]:
            with self.subTest(tasks=tasks), self.assertRaises(BoardError):
                self.init(tasks)
        self.init()
        with self.assertRaises(BoardError):
            self.init()
        self.assertEqual(len(self.board.status()), 1)


if __name__ == '__main__':
    unittest.main()
