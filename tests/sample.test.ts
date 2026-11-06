import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

describe('sample', () => {
  it('should pass a basic assertion', () => {
    assert.strictEqual(1 + 1, 2);
  });
});
