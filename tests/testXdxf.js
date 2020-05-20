// import XML from 'xml.one';
// require = require('esm')(module);
// const XML = require('xml.one');
import XML from 'xml.one';

const exampleXML = `<?xml version="1.0"?>
<?xml-stylesheet type="text/xsl" href="example.xsl"?>
<Article>
  <Title>My Article</Title>
  <Authors>
    <Author>Mr. Foo</Author>
    <Author>Mr. Bar</Author>
  </Authors>
  <Body>This is my article text.</Body>
</Article>`;

const exampleXSLT = `<?xml version="1.0"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

  <xsl:output method="text"/>

  <xsl:template match="/">
    Article - <xsl:value-of select="/Article/Title"/>
    Authors: <xsl:apply-templates select="/Article/Authors/Author"/>
  </xsl:template>

  <xsl:template match="Author">
    - <xsl:value-of select="." />
  </xsl:template>

</xsl:stylesheet>`;

const xml = XML.parse(exampleXML);

// console.log(XML.stringify(xml));
console.log(XML.stringify(XML.transform(xml, exampleXSLT)));

const xdxf = `<k>line of duty</k>
<blockquote><co><b>Date:</b> circa 1918</co></blockquote>
<blockquote><dtrn> <b>:</b> all that is authorized, required, or normally associated with some field of responsibility</dtrn></blockquote>`;
