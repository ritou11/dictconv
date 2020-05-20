import XMLDOM from 'xmldom-ts';
import XSLT from 'xslt-ts';
import { loadStaticFile } from './utils.js';

XSLT.install(new XMLDOM.DOMParserImpl(), new XMLDOM.XMLSerializerImpl(), new XMLDOM.DOMImplementationImpl());
const parser = new DOMParser();
const xmlParse = (XMLstring, contentType = 'xml') => {
  let document = parser.parseFromString(XMLstring, 'text/'+contentType);
  return document;
}
const xsltString = loadStaticFile('templates/xdxf.xsl');
const processor = new XSLT.XSLTProcessor();
processor.importStylesheet(xmlParse(xsltString));

const xdxfTransform = (xdxf) => {
  return processor.transformToDocument(xmlParse(xdxf)).toString();
};

export { xdxfTransform };
