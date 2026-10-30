import { describe, expect, it } from 'vitest';
import { CHAT_BLOCK_INSTRUCTION, parseChatBlock, splitChatBlocks } from './chatBlocks';

describe('chatBlocks', () => {
  it('splits prose from fenced blocks', () => {
    const text = 'Here is the plan.\n\n:::block{"type":"steps","title":"Connect","items":["a","b"]}\n\nThat is all.';
    const chunks = splitChatBlocks(text);
    expect(chunks[0]).toEqual({ kind: 'text', text: 'Here is the plan.' });
    expect(chunks[1].kind).toBe('block');
    expect(chunks[2]).toEqual({ kind: 'text', text: 'That is all.' });
  });

  it('returns text only when no blocks are present', () => {
    const chunks = splitChatBlocks('Just prose.');
    expect(chunks).toEqual([{ kind: 'text', text: 'Just prose.' }]);
  });

  it('rejects unknown block types and malformed json', () => {
    expect(parseChatBlock('{"type":"nope"}')).toBeNull();
    expect(parseChatBlock('not json')).toBeNull();
    expect(parseChatBlock('[1,2]')).toBeNull();
  });

  it('normalises items and clamps the trend field', () => {
    const block = parseChatBlock('{"type":"list","items":["plain",{"label":"x","detail":"y","status":"ok"},{"label":"z","status":"weird"}]}');
    expect(block?.items?.[0]).toBe('plain');
    expect(block?.items?.[1]).toEqual({ label: 'x', detail: 'y', status: 'ok' });
    expect(block?.items?.[2]).toEqual({ label: 'z', detail: undefined, status: 'idle' });
  });

  it('keeps the instruction block prompt free of unresolved placeholders', () => {
    expect(CHAT_BLOCK_INSTRUCTION).toContain('steps');
    expect(CHAT_BLOCK_INSTRUCTION.length).toBeGreaterThan(50);
  });
});
