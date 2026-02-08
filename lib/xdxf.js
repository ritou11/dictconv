import XMLDOM from 'xmldom-ts';
import XSLT from 'xslt-ts';
import { loadStaticFile } from './utils.js';

XSLT.install(new XMLDOM.DOMParserImpl(), new XMLDOM.XMLSerializerImpl(), new XMLDOM.DOMImplementationImpl());
const parser = new XMLDOM.DOMParserImpl();
const xmlParse = (XMLstring, contentType = 'xml') =>
  parser.parseFromString(XMLstring, `text/${contentType}`);
const xsltString = loadStaticFile('templates/xdxf.xsl');
const processor = new XSLT.XSLTProcessor();
processor.importStylesheet(xmlParse(xsltString));

const xdxfTransform = (xdxf) =>
  processor.transformToDocument(xmlParse(xdxf)).toString();

export { xdxfTransform };
