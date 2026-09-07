import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseJsonObject, stripJsonFence } from "@/server/ai/json";

describe("model JSON extraction", () => {
  it("reads a bare JSON object", () => {
    assert.deepEqual(parseJsonObject('{"a":1}'), { a: 1 });
  });

  it("unwraps fenced JSON in any casing", () => {
    assert.deepEqual(parseJsonObject('```json\n{"a":1}\n```'), { a: 1 });
    assert.deepEqual(parseJsonObject('```JSON\n{"a":1}\n```'), { a: 1 });
    assert.deepEqual(parseJsonObject('```\n{"a":1}\n```'), { a: 1 });
  });

  it("ignores prose the model adds around the object", () => {
    assert.deepEqual(parseJsonObject('Đây là kết quả:\n{"a":1}\nHy vọng hữu ích.'), { a: 1 });
  });

  it("keeps nested objects intact by using the outermost braces", () => {
    assert.deepEqual(parseJsonObject('{"items":[{"day":1}],"meta":{"ok":true}}'), {
      items: [{ day: 1 }],
      meta: { ok: true },
    });
  });

  it("throws when the response contains no object", () => {
    assert.throws(() => parseJsonObject("xin lỗi, tôi không thể"), /JSON/);
    assert.throws(() => parseJsonObject("}{"), /JSON/);
    assert.throws(() => parseJsonObject(""), /JSON/);
  });

  it("throws on an object that is not valid JSON", () => {
    assert.throws(() => parseJsonObject('{"a": }'));
  });

  it("stripJsonFence returns the cleaned text when there is no object", () => {
    assert.equal(stripJsonFence("```\nplain text\n```"), "plain text");
    assert.equal(stripJsonFence('```json\n{"a":1}\n```'), '{"a":1}');
  });
});
