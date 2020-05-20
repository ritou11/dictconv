import XMLDOM from 'xmldom-ts';
import XSLT from 'xslt-ts';

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

XSLT.install(new XMLDOM.DOMParserImpl(), new XMLDOM.XMLSerializerImpl(), new XMLDOM.DOMImplementationImpl());

const xmlParse = (XMLstring, contentType = 'xml') => {
  let document = new DOMParser().parseFromString(XMLstring, 'text/'+contentType);
  return document;
}
const xsl = exampleXSLT;

const processor = new XSLT.XSLTProcessor();
processor.importStylesheet(xmlParse(xsl));

const output = processor.transformToDocument(xmlParse(exampleXML));
console.log(output.toString());
