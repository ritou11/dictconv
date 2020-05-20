# dictconv: Mac Dictionary Converter

[![npm](https://img.shields.io/npm/v/@ritou11/dictconv.svg?style=flat-square)](https://www.npmjs.com/package/@ritou11/dictconv)
[![npm](https://img.shields.io/npm/dt/@ritou11/dictconv.svg?style=flat-square)](https://www.npmjs.com/package/@ritou11/dictconv)
[![GitHub last commit](https://img.shields.io/github/last-commit/ritou11/dictconv.svg?style=flat-square)](https://github.com/ritou11/dictconv)
[![GitHub code size in bytes](https://img.shields.io/github/languages/code-size/ritou11/dictconv.svg?style=flat-square)](https://github.com/ritou11/dictconv)
[![license](https://img.shields.io/github/license/ritou11/dictconv.svg?style=flat-square)](https://github.com/ritou11/dictconv/blob/master/LICENSE.md)

> Author: Nogeek
>
> Email: ritou11@gmail.com

## TL;DR

`dictconv convert <stardict_xxxxx.tar.bz2> -i -v`
Building would take some time, please be patient.

## Background
A Node.js version of [DictUnifier](https://github.com/jjgod/mac-dictionary-kit). The original repo is no longer maintained, while I really want a converter for the Stardicts.

Require Node.js >= 12 to support ES module.

## Installation

`yarn global add @ritou11/dictconv` or `npm i -g @ritou11/dictconv`

You'll also need `gunzip`, `tar`,`cp`,`mkdir` in your system path. They should be installed with MacOSX already.

## Usage
```
dictconv [command]

Commands:
  dictconv raw <stardict> <destPath>        Convert the startdict to xml
                                            dictionary.
  dictconv build <rawPath> [<destPath>]     Build the Mac dictionary from raw
                                            data
  dictconv convert <stardict> [<destPath>]  Convert the startdict to Mac
                                            dictionary.

Options:
  --version   Show version number                                      [boolean]
  -h, --help  Show help                                                [boolean]
```
```
dictconv raw <stardict> <destPath>

Convert the startdict to xml dictionary.

Positionals:
  stardict  <stardict> The path to the stardict file.        [string] [required]
  destPath  <destPath> The destination path.                 [string] [required]
```
```
dictconv build <rawPath> [<destPath>]

Build the Mac dictionary from raw data

Positionals:
  rawPath  <rawPath> The path to the raw data files.         [string] [required]

Options:
  --version      Show version number                                   [boolean]
  --name, -n     The name of dictionary                                 [string]
  --install, -i  Install the converted dictionary to the system
                                                      [boolean] [default: false]
```
```
dictconv convert <stardict> [<destPath>]

Convert the startdict to Mac dictionary.

Positionals:
  stardict  <stardict> The path to the stardict file.        [string] [required]
  destPath  <destPath> The destination path.                            [string]

Options:
  --version      Show version number                                   [boolean]
  --name, -n     The name of dictionary                                 [string]
  --install, -i  Install the converted dictionary to the system
                                                      [boolean] [default: false]
```
## TODOs
1. duplicated index
2. stardict 3.0.0 and idxoffsetbits=64 support
3. res convert
4. better way to get the unarchived path

## License

MIT
