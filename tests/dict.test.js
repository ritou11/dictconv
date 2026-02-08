import { describe, it } from 'mocha';
import { expect } from 'chai';
import { parsePowerWord, parseDictData, convertDictData } from '../lib/dict.js';

describe('parsePowerWord', () => {
  describe('English-Chinese (EC) dictionary format', () => {
    it('should parse apple entry with phonetic and part of speech', () => {
      const xml = `<JS>
<CY>
<CX>
<YX><![CDATA[apple]]></YX>
<YB>
<CB><![CDATA[ˈæpl]]></CB>
</YB>
<YB>
</YB>
<DX><![CDATA[n.]]></DX>
<JX><![CDATA[苹果; 苹果树]]></JX>
</CX>
</CY>
</JS>`;

      const result = parsePowerWord(xml);

      expect(result).to.include('<div class="powerword-entry">');
      expect(result).to.include('[ˈæpl]');
      expect(result).to.include('<span class="pos">n.</span>');
      expect(result).to.include('苹果; 苹果树');
    });

    it('should parse entry with multiple definitions and parts of speech', () => {
      const xml = `<JS>
<CY>
<CX>
<YX><![CDATA[run]]></YX>
<YB>
<CB><![CDATA[rʌn]]></CB>
</YB>
<DX><![CDATA[vt. & vi.]]></DX>
<JX><![CDATA[跑；移动；(使)流动]]></JX>
<JX><![CDATA[跑, 奔跑]]></JX>
<JX><![CDATA[旅行, 旅程]]></JX>
</CX>
</CY>
</JS>`;

      const result = parsePowerWord(xml);

      expect(result).to.include('[rʌn]');
      expect(result).to.include('<span class="pos">vt. &amp; vi.</span>');
      expect(result).to.include('跑；移动；(使)流动');
      expect(result).to.include('跑, 奔跑');
      expect(result).to.include('旅行, 旅程');
    });

    it('should handle empty YB blocks gracefully', () => {
      const xml = `<JS>
<CY>
<CX>
<YX><![CDATA[test]]></YX>
<YB>
</YB>
<DX><![CDATA[n.]]></DX>
<JX><![CDATA[测验]]></JX>
</CX>
</CY>
</JS>`;

      const result = parsePowerWord(xml);

      expect(result).to.include('<div class="powerword-entry">');
      expect(result).to.include('测验');
    });
  });

  describe('Chinese-English (CE) dictionary format', () => {
    it('should parse 香 entry with pinyin and &L{...} definitions', () => {
      const xml = `<JS>
<CY>
<CX>
<YX><![CDATA[香]]></YX>
<YB>
<PY><![CDATA[xiāng]]></PY>
</YB>
<JX><![CDATA[&L{aromatic}&L{fragrant}&L{savory}]]></JX>
</CX>
</CY>
</JS>`;

      const result = parsePowerWord(xml);

      expect(result).to.include('<div class="powerword-entry">');
      expect(result).to.include('[xiāng]');
      expect(result).to.include('aromatic');
      expect(result).to.include('fragrant');
      expect(result).to.include('savory');
      // Should NOT include raw &L{ syntax
      expect(result).to.not.include('&L{aromatic}');
      expect(result).to.not.include('&L{');
    });

    it('should parse entry with &x{...} pinyin wrapper', () => {
      const xml = `<JS>
<CY>
<CX>
<YX><![CDATA[一串香蕉]]></YX>
<YB>
<PY><![CDATA[&x{yīchuànxiāngjiāo}]]></PY>
</YB>
<JX><![CDATA[&L{a hand of bananas}]]></JX>
</CX>
</CY>
</JS>`;

      const result = parsePowerWord(xml);

      expect(result).to.include('[yīchuànxiāngjiāo]');
      expect(result).to.include('a hand of bananas');
      expect(result).to.not.include('&x{');
      expect(result).to.not.include('&L{');
    });

    it('should parse 一 with multiple &L{...} definitions', () => {
      const xml = `<JS>
<CY>
<CX>
<YX><![CDATA[一]]></YX>
<YB>
<PY><![CDATA[yī]]></PY>
</YB>
<JX><![CDATA[&L{a}&L{an}&L{each}&L{one}&L{per}&L{same}&L{single}&L{whole}&L{wholehearted}]]></JX>
</CX>
</CY>
</JS>`;

      const result = parsePowerWord(xml);

      expect(result).to.include('[yī]');
      expect(result).to.include('a');
      expect(result).to.include('an');
      expect(result).to.include('each');
      expect(result).to.include('one');
      expect(result).to.include('per');
      expect(result).to.include('same');
      expect(result).to.include('single');
      expect(result).to.include('whole');
      expect(result).to.include('wholehearted');
    });
  });

  describe('Edge cases', () => {
    it('should handle multiple JS entries', () => {
      const xml = `<JS>
<CY>
<CX>
<YX><![CDATA[apple]]></YX>
<YB>
<CB><![CDATA[ˈæpl]]></CB>
</YB>
<DX><![CDATA[n.]]></DX>
<JX><![CDATA[苹果]]></JX>
</CX>
</CY>
</JS>
<JS>
<CY>
<CX>
<YX><![CDATA[banana]]></YX>
<YB>
<CB><![CDATA[bəˈnɑːnə]]></CB>
</YB>
<DX><![CDATA[n.]]></DX>
<JX><![CDATA[香蕉]]></JX>
</CX>
</CY>
</JS>`;

      const result = parsePowerWord(xml);

      expect(result).to.include('苹果');
      expect(result).to.include('香蕉');
    });

    it('should handle entry without phonetics', () => {
      const xml = `<JS>
<CY>
<CX>
<YX><![CDATA[test]]></YX>
<DX><![CDATA[n.]]></DX>
<JX><![CDATA[definition]]></JX>
</CX>
</CY>
</JS>`;

      const result = parsePowerWord(xml);

      expect(result).to.include('<div class="powerword-entry">');
      expect(result).to.include('definition');
    });

    it('should handle empty definitions gracefully', () => {
      const xml = `<JS>
<CY>
<CX>
<YX><![CDATA[test]]></YX>
<YB>
<CB><![CDATA[test]]></CB>
</YB>
<JX><![CDATA[]]></JX>
</CX>
</CY>
</JS>`;

      const result = parsePowerWord(xml);

      expect(result).to.include('<div class="powerword-entry">');
    });
  });
});

describe('parseDictData', () => {
  it('should handle single-type sequence (sametypesequence=k)', () => {
    const xml = '<JS><CY><CX><YX><![CDATA[apple]]></YX><YB><CB><![CDATA[ˈæpl]]></CB></YB><DX><![CDATA[n.]]></DX><JX><![CDATA[苹果]]></JX></CX></CY></JS>';
    const buffer = Buffer.from(xml, 'utf8');

    const result = parseDictData(buffer, 'k');

    expect(result).to.have.lengthOf(1);
    expect(result[0].type).to.equal('k');
    expect(result[0].xml).to.include('苹果');
    expect(result[0].xml).to.include('[ˈæpl]');
  });

  it('should handle multiple types with null terminators', () => {
    // Create buffer with two null-terminated text entries (type 'm,m')
    const text1 = 'definition 1';
    const text2 = 'definition 2';
    const buffer = Buffer.alloc(text1.length + 1 + text2.length + 1);
    let pos = 0;
    buffer.write(text1, pos);
    pos += text1.length;
    buffer[pos++] = 0;
    buffer.write(text2, pos);
    pos += text2.length;
    buffer[pos++] = 0;

    const result = parseDictData(buffer, 'mm');

    expect(result).to.have.lengthOf(2);
    expect(result[0].xml).to.include('definition 1');
    expect(result[1].xml).to.include('definition 2');
  });

  it('should handle empty types (no sametypesequence)', () => {
    // Buffer with type prefix 'm' followed by null-terminated text
    const text = 'test definition';
    const buffer = Buffer.alloc(1 + text.length + 1);
    buffer[0] = 'm'.charCodeAt(0);
    buffer.write(text, 1);
    buffer[1 + text.length] = 0;

    const result = parseDictData(buffer, '');

    expect(result).to.have.lengthOf(1);
    expect(result[0].type).to.equal('m');
    expect(result[0].xml).to.include('test definition');
  });

  it('should handle media file types (W, P, X)', () => {
    const buffer = Buffer.alloc(5);
    buffer[0] = 'W'.charCodeAt(0);
    buffer.writeUInt32BE(0, 1);

    const result = parseDictData(buffer, 'W');

    expect(result).to.have.lengthOf(1);
    expect(result[0].type).to.equal('W');
    expect(result[0].xml).to.include('Media file is not supported');
  });

  it('should handle resource file type (r)', () => {
    const buffer = Buffer.from('rtest\0');

    const result = parseDictData(buffer, 'r');

    expect(result).to.have.lengthOf(1);
    expect(result[0].type).to.equal('r');
    expect(result[0].xml).to.include('Resource file is not supported');
  });
});

describe('convertDictData', () => {
  it('should handle HTML type (h)', () => {
    const html = '<b>bold</b><i>italic</i>';
    const buffer = Buffer.from(html, 'utf8');

    const result = convertDictData(buffer, 'h');

    // HTML is preserved with allowed tags kept intact
    expect(result).to.include('<b>bold</b>');
    expect(result).to.include('<i>italic</i>');
  });

  it('should convert Chinese ruby notation in HTML type', () => {
    const html = '`1`智`2`zhì<br>definition text';
    const buffer = Buffer.from(html, 'utf8');

    const result = convertDictData(buffer, 'h');

    // Ruby notation should be converted to proper HTML
    expect(result).to.include('<ruby>智<rt>zhì</rt></ruby>');
    // BR tag should be preserved
    expect(result).to.include('<br>');
  });

  it('should handle Pango type (g)', () => {
    const text = '<span>some pango markup</span>';
    const buffer = Buffer.from(text, 'utf8');

    const result = convertDictData(buffer, 'g');

    expect(result).to.include('<pre>');
    expect(result).to.include('some pango markup');
  });

  it('should handle plain text type (m)', () => {
    const text = 'plain text definition';
    const buffer = Buffer.from(text, 'utf8');

    const result = convertDictData(buffer, 'm');

    expect(result).to.include('plain text definition');
    expect(result).to.include('<p class="plaintext">');
  });

  it('should handle XDXF type (x)', () => {
    const xml = '<k>word</k><dtrn>translation</dtrn>';
    const buffer = Buffer.from(xml, 'utf8');

    const result = convertDictData(buffer, 'x');

    // The XSLT template removes <k> tags but keeps other content
    expect(result).to.include('translation');
  });

  it('should handle PowerWord type (k)', () => {
    const xml = '<JS><CY><CX><YX><![CDATA[apple]]></YX><YB><CB><![CDATA[test]]></CB></YB><JX><![CDATA[definition text]]></JX></CX></CY></JS>';
    const buffer = Buffer.from(xml, 'utf8');

    const result = convertDictData(buffer, 'k');

    // YX (word) is not displayed, only phonetics and definitions
    expect(result).to.include('[test]');
    expect(result).to.include('definition text');
  });
});
