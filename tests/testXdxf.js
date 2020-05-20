/* eslint-disable import/extensions */
import { xdxfTransform } from '../lib/xdxf.js';

const xdxf = `<co><k>line of duty</k>
<blockquote><co><b>Date:</b> circa 1918</co></blockquote>
<blockquote><dtrn> <b>:</b> &quot; all that is authorized, required, or normally associated with some field of responsibility</dtrn></blockquote></co>`;

console.log(xdxfTransform(xdxf));
