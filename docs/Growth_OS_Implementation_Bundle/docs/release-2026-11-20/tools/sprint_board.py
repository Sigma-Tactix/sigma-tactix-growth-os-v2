#!/usr/bin/env python3
"""Local sprint coordination, not a model launcher or security boundary.

Uses SQLite transactions for exclusive task/resource claims. Declared worker names
and roles are labels, not authenticated identities. Evidence files and exact
commit receipts are checked; tests are never executed or certified by this tool.
Resource keys are opaque: every writer to a shared file/service must use the same
key. Claimed/submitted/reviewed tasks retain locks until integration or a rejected
review. Expired work retains locks until explicit integrator reconciliation.
"""
from __future__ import annotations

import argparse
from contextlib import contextmanager
import json
from pathlib import Path
import re
import sqlite3
import time


class BoardError(ValueError):
    pass


class Board:
    def __init__(self, db, clock=None):
        self.clock = clock or time.time
        self.db = sqlite3.connect(str(db), timeout=30, isolation_level=None)
        self.db.row_factory = sqlite3.Row
        self.db.execute("PRAGMA foreign_keys=ON")
        self.db.executescript("""
          CREATE TABLE IF NOT EXISTS meta(key TEXT PRIMARY KEY, value TEXT NOT NULL);
          CREATE TABLE IF NOT EXISTS tasks(
            id TEXT PRIMARY KEY, position INTEGER NOT NULL, role TEXT NOT NULL,
            deps TEXT NOT NULL, resources TEXT NOT NULL, state TEXT NOT NULL,
            attempts INTEGER NOT NULL DEFAULT 0, failures INTEGER NOT NULL DEFAULT 0,
            owner TEXT, lease REAL, commit_sha TEXT, evidence TEXT,
            reviewer TEXT, integrated_by TEXT, blocked_reason TEXT);
          CREATE TABLE IF NOT EXISTS locks(
            resource TEXT PRIMARY KEY, task_id TEXT NOT NULL REFERENCES tasks(id));
          CREATE TABLE IF NOT EXISTS events(
            seq INTEGER PRIMARY KEY AUTOINCREMENT, at REAL NOT NULL,
            task_id TEXT, worker TEXT, event TEXT NOT NULL, detail TEXT NOT NULL);
        """)

    def close(self):
        self.db.close()

    @contextmanager
    def tx(self):
        self.db.execute("BEGIN IMMEDIATE")
        try:
            yield
        except Exception:
            self.db.rollback()
            raise
        else:
            self.db.commit()

    def _event(self, task, worker, event, detail=None):
        self.db.execute("INSERT INTO events(at,task_id,worker,event,detail) VALUES(?,?,?,?,?)",
                        (self.clock(), task, worker, event, json.dumps(detail or {})))

    def _expire(self):
        rows = self.db.execute("SELECT id,owner FROM tasks WHERE state='claimed' AND lease<=?",
                               (self.clock(),)).fetchall()
        for row in rows:
            self.db.execute("UPDATE tasks SET state='blocked',blocked_reason='lease_expired' WHERE id=?",
                            (row['id'],))
            self._event(row['id'], row['owner'], 'lease_expired')

    def _task(self, task):
        row = self.db.execute("SELECT * FROM tasks WHERE id=?", (task,)).fetchone()
        if row is None:
            raise BoardError(f'Unknown task: {task}')
        return row

    def _root(self):
        row = self.db.execute("SELECT value FROM meta WHERE key='repo'").fetchone()
        if not row:
            raise BoardError('Initialize the board first.')
        return Path(row['value'])

    @staticmethod
    def _label(value, field):
        if not isinstance(value, str) or not value.strip():
            raise BoardError(f'{field} must be a nonempty string.')
        return value.strip()

    def init(self, payload, repo):
        repo = Path(repo).resolve()
        if not repo.is_dir():
            raise BoardError('Repository directory does not exist.')
        tasks = payload.get('tasks') if isinstance(payload, dict) else payload
        if not isinstance(tasks, list) or not tasks:
            raise BoardError('Expected a nonempty task array or an object with tasks[].')
        normalized = []
        for task in tasks:
            if not isinstance(task, dict):
                raise BoardError('Each task must be an object.')
            task_id = self._label(task.get('id'), 'id')
            role = self._label(task.get('role'), 'role')
            deps = task.get('depends_on', task.get('dependencies', task.get('deps', [])))
            resources = task.get('resources', [])
            for name, values in [('dependencies', deps), ('resources', resources)]:
                if not isinstance(values, list):
                    raise BoardError(f'{name} must be an array.')
                for value in values:
                    self._label(value, name)
            normalized.append((task_id, role, list(dict.fromkeys(deps)), list(dict.fromkeys(resources))))
        graph = {t[0]: t[2] for t in normalized}
        if len(graph) != len(normalized):
            raise BoardError('Duplicate task IDs.')
        visited, active = set(), set()

        def visit(task):
            if task in active:
                raise BoardError('Dependency cycle.')
            if task not in graph:
                raise BoardError(f'Unknown dependency: {task}')
            if task in visited:
                return
            active.add(task)
            for dep in graph[task]:
                visit(dep)
            active.remove(task)
            visited.add(task)

        for task in graph:
            visit(task)
        with self.tx():
            if self.db.execute('SELECT 1 FROM meta LIMIT 1').fetchone():
                raise BoardError('Board already initialized; existing state is never overwritten.')
            self.db.execute("INSERT INTO meta VALUES('repo',?)", (str(repo),))
            for position, (task, role, deps, resources) in enumerate(normalized):
                self.db.execute('INSERT INTO tasks(id,position,role,deps,resources,state) VALUES(?,?,?,?,?,?)',
                                (task, position, role, json.dumps(deps), json.dumps(resources), 'pending'))
            self._event(None, None, 'initialized', {'tasks': len(normalized)})
        return {'tasks': len(normalized), 'repo': str(repo)}

    def _ready(self, role=None):
        self._root()
        states = {r['id']: r['state'] for r in self.db.execute('SELECT id,state FROM tasks')}
        occupied = {r['resource'] for r in self.db.execute('SELECT resource FROM locks')}
        result = []
        for row in self.db.execute("SELECT * FROM tasks WHERE state='pending' ORDER BY position"):
            if role and row['role'] != role:
                continue
            if any(states[dep] != 'integrated' for dep in json.loads(row['deps'])):
                continue
            if occupied.intersection(json.loads(row['resources'])):
                continue
            result.append(dict(row))
        return result

    def ready(self, role=None):
        with self.tx():
            self._expire()
            return self._ready(role)

    def claim(self, worker, role, task=None, lease_minutes=30):
        worker = self._label(worker, 'worker')
        role = self._label(role, 'role')
        if not 1 <= lease_minutes <= 30:
            raise BoardError('Lease must be between 1 and 30 minutes.')
        with self.tx():
            self._expire()
            if self.db.execute("SELECT 1 FROM tasks WHERE owner=? AND state='claimed'", (worker,)).fetchone():
                raise BoardError('Worker already has a claimed task.')
            options = self._ready(role)
            row = next((r for r in options if task is None or r['id'] == task), None)
            if row is None:
                return None
            until = self.clock() + lease_minutes * 60
            self.db.execute("UPDATE tasks SET state='claimed',owner=?,lease=?,attempts=attempts+1,"
                            "commit_sha=NULL,evidence=NULL,reviewer=NULL,blocked_reason=NULL WHERE id=?",
                            (worker, until, row['id']))
            for resource in json.loads(row['resources']):
                self.db.execute('INSERT INTO locks VALUES(?,?)', (resource, row['id']))
            self._event(row['id'], worker, 'claimed', {'lease': until})
            return dict(self._task(row['id']))

    def heartbeat(self, task, worker):
        with self.tx():
            self._expire()
            row = self._task(task)
            if row['state'] != 'claimed' or row['owner'] != worker:
                raise BoardError('Only the current owner of an unexpired claim may heartbeat.')
            until = self.clock() + 30 * 60
            self.db.execute('UPDATE tasks SET lease=? WHERE id=?', (until, task))
            self._event(task, worker, 'heartbeat', {'lease': until})
            return {'id': task, 'lease': until}

    def _evidence(self, refs):
        if not isinstance(refs, list) or not refs:
            raise BoardError('At least one repository-contained evidence file is required.')
        root = self._root()
        result = []
        for ref in refs:
            self._label(ref, 'evidence reference')
            path = Path(ref)
            path = (root / path).resolve() if not path.is_absolute() else path.resolve()
            try:
                relative = path.relative_to(root)
            except ValueError:
                raise BoardError('Evidence must stay inside the repository directory.') from None
            if not path.is_file():
                raise BoardError(f'Evidence file does not exist: {relative}')
            result.append(str(relative))
        return list(dict.fromkeys(result))

    def submit(self, task, worker, commit, evidence):
        if not isinstance(commit, str) or not re.fullmatch(r'[0-9a-f]{40}|[0-9a-f]{64}', commit):
            raise BoardError('Provide a full lowercase 40- or 64-character commit SHA.')
        # Expiry changes must persist even if a later state check rejects submit.
        self.status()
        with self.tx():
            row = self._task(task)
            if row['state'] != 'claimed' or row['owner'] != worker or row['lease'] <= self.clock():
                raise BoardError('Only the current owner of an unexpired claim may submit.')
            refs = self._evidence(evidence)
            self.db.execute("UPDATE tasks SET state='submitted',lease=NULL,commit_sha=?,evidence=? WHERE id=?",
                            (commit, json.dumps(refs), task))
            self._event(task, worker, 'submitted', {'commit': commit, 'evidence': refs})
            return dict(self._task(task))

    def review(self, task, worker, passed, note):
        worker = self._label(worker, 'worker')
        self._label(note, 'review note')
        with self.tx():
            row = self._task(task)
            if row['state'] != 'submitted':
                raise BoardError('Review requires a submitted task.')
            if row['owner'] == worker:
                raise BoardError('The author cannot review their own task.')
            if passed:
                self._evidence(json.loads(row['evidence']))
                self.db.execute("UPDATE tasks SET state='reviewed',reviewer=? WHERE id=?", (worker, task))
            else:
                failures = row['failures'] + 1
                state = 'escalated' if failures >= 2 else 'pending'
                self.db.execute('UPDATE tasks SET state=?,failures=?,reviewer=?,blocked_reason=? WHERE id=?',
                                (state, failures, worker, 'review_failed', task))
                self.db.execute('DELETE FROM locks WHERE task_id=?', (task,))
            self._event(task, worker, 'review_pass' if passed else 'review_fail', {'note': note})
            return dict(self._task(task))

    def integrate(self, task, worker, role, receipt):
        if role != 'integrator':
            raise BoardError('Integration requires the integrator role.')
        worker = self._label(worker, 'worker')
        with self.tx():
            row = self._task(task)
            if row['state'] != 'reviewed':
                raise BoardError('Integration requires an independently reviewed task.')
            refs = self._evidence([receipt])
            try:
                proof = json.loads((self._root() / refs[0]).read_text())
            except (OSError, ValueError):
                raise BoardError('Verification receipt must be valid JSON.') from None
            if not isinstance(proof, dict) or proof.get('commit') != row['commit_sha']:
                raise BoardError('Receipt commit must exactly match the submitted commit.')
            if proof.get('command') != 'npm run verify' or type(proof.get('exit_code')) is not int or proof['exit_code'] != 0:
                raise BoardError('Receipt must record npm run verify with integer exit_code 0.')
            logs = self._evidence(proof.get('evidence'))
            self.db.execute("UPDATE tasks SET state='integrated',integrated_by=? WHERE id=?", (worker, task))
            self.db.execute('DELETE FROM locks WHERE task_id=?', (task,))
            self._event(task, worker, 'integrated', {'receipt': refs[0], 'logs': logs})
            return dict(self._task(task))

    def reconcile(self, task, worker, role, resolution, note):
        if role != 'integrator':
            raise BoardError('Reconciliation requires the integrator role.')
        self._label(note, 'reconciliation note')
        if resolution not in ('retry', 'cancel'):
            raise BoardError('Resolution must be retry or cancel.')
        with self.tx():
            self._expire()
            row = self._task(task)
            if row['state'] != 'blocked' or row['blocked_reason'] != 'lease_expired':
                raise BoardError('Only an expired blocked claim can be reconciled.')
            failures = row['failures'] + (resolution == 'retry')
            state = 'cancelled' if resolution == 'cancel' else ('escalated' if failures >= 2 else 'pending')
            self.db.execute('UPDATE tasks SET state=?,failures=?,lease=NULL,blocked_reason=? WHERE id=?',
                            (state, failures, 'reconciled_expiry', task))
            self.db.execute('DELETE FROM locks WHERE task_id=?', (task,))
            self._event(task, worker, 'reconciled', {'resolution': resolution, 'note': note})
            return dict(self._task(task))

    def status(self):
        with self.tx():
            self._root()
            self._expire()
            return [dict(r) for r in self.db.execute('SELECT * FROM tasks ORDER BY position')]


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--db', required=True)
    commands = parser.add_subparsers(dest='command', required=True)
    init = commands.add_parser('init')
    init.add_argument('tasks_json')
    init.add_argument('--repo', required=True)
    ready = commands.add_parser('ready')
    ready.add_argument('--role')
    claim = commands.add_parser('claim')
    claim.add_argument('--worker', required=True)
    claim.add_argument('--role', required=True)
    claim.add_argument('--task')
    claim.add_argument('--lease-minutes', type=int, default=30)
    for command in ('heartbeat', 'submit', 'review', 'integrate', 'reconcile'):
        sub = commands.add_parser(command)
        sub.add_argument('task')
        sub.add_argument('--worker', required=True)
        if command == 'submit':
            sub.add_argument('--commit', required=True)
            sub.add_argument('--evidence', nargs='+', required=True)
        elif command == 'review':
            sub.add_argument('--result', choices=['pass', 'fail'], required=True)
            sub.add_argument('--note', required=True)
        elif command == 'integrate':
            sub.add_argument('--role', required=True)
            sub.add_argument('--receipt', required=True)
        elif command == 'reconcile':
            sub.add_argument('--role', required=True)
            sub.add_argument('--resolution', choices=['retry', 'cancel'], required=True)
            sub.add_argument('--note', required=True)
    commands.add_parser('status')
    args = parser.parse_args(argv)
    board = Board(args.db)
    try:
        if args.command == 'init':
            result = board.init(json.loads(Path(args.tasks_json).read_text()), args.repo)
        elif args.command == 'ready':
            result = board.ready(args.role)
        elif args.command == 'claim':
            result = board.claim(args.worker, args.role, args.task, args.lease_minutes)
        elif args.command == 'heartbeat':
            result = board.heartbeat(args.task, args.worker)
        elif args.command == 'submit':
            result = board.submit(args.task, args.worker, args.commit, args.evidence)
        elif args.command == 'review':
            result = board.review(args.task, args.worker, args.result == 'pass', args.note)
        elif args.command == 'integrate':
            result = board.integrate(args.task, args.worker, args.role, args.receipt)
        elif args.command == 'reconcile':
            result = board.reconcile(args.task, args.worker, args.role, args.resolution, args.note)
        else:
            result = board.status()
        print(json.dumps(result, indent=2))
        return 0
    except (BoardError, OSError, ValueError, sqlite3.Error) as error:
        print(json.dumps({'error': str(error)}))
        return 2
    finally:
        board.close()


if __name__ == '__main__':
    raise SystemExit(main())
