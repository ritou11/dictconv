/* eslint-disable import/extensions */
import { xdxfTransform } from '../lib/xdxf.js';

const xdxf = `<k>line of duty</k>
<blockquote><co><b>Date:</b> circa 1918</co></blockquote>
<blockquote><dtrn> <b>:</b> all that is authorized, required, or normally associated with some field of responsibility</dtrn></blockquote>`;

console.log(xdxfTransform(xdxf));
