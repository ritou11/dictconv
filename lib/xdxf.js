import XML from 'xml.one';
import { loadStaticFile } from './utils.js';

const xsltString = loadStaticFile('templates/xdxf.xsl');
const xdxfTransform = (xdxf) => {
  const xml = XML.parse(xdxf);
  return XML.stringify(XML.transform(xml, xsltString));
};

export { xdxfTransform };
