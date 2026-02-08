# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

dictconv is a Node.js CLI tool that converts StarDict dictionaries to macOS Dictionary format. It's a Node.js reimplementation of DictUnifier.

**Key Technologies:**
- ES Modules (Node.js >= 12)
- XSLT transformation using `xmldom-ts` and `xslt-ts`
- Shell command execution for dictionary building

## Commands

```bash
# Run the CLI
node index.js

# Run tests (individual test files)
node tests/testXdxf.js
node tests/testxlstts.js
node tests/testxmlone.js

# Lint (ESLint with Airbnb config)
npx eslint lib/ index.js
```

## Architecture

### Entry Points
- `bin/dictconv.js` - CLI entry point
- `index.js` - Main command definitions using yargs

### Core Modules

**lib/raw.js**
- `fromArchive()` - Extracts tar.bz2/tar.gz archives, finds .ifo files
- `fromIfo()` - Processes .ifo + .idx + .dict.dz files
- `convert()` - Converts dictionary data to Apple's XML format

**lib/dict.js**
- `Dictionary` class - Parses StarDict format (.ifo, .idx, .dict files)
- `parseDictData()` - Handles different data types (HTML 'h', XDXF 'x', Pango 'g', etc.)
- `convertDictData()` - Transforms content to Apple Dictionary XML

**lib/xdxf.js**
- `xdxfTransform()` - XSLT transformation for XDXF markup using xslt-ts
- Uses templates from `templates/xdxf.xsl`

**lib/build.js**
- `buildDictionary()` - Spawns `bin/build_dict.sh` to create .dictionary bundle
- Sets `DICT_DEV_KIT_OBJ_DIR` environment variable for output path

**lib/utils.js**
- `html2text()` - Strips HTML tags from content
- `cleanXml()` - Escapes XML entities and removes invalid characters
- `mkTmpdir()` - Creates temp directories in system tmpdir

### Build System

The actual dictionary building is done by shell scripts in `bin/`:
- `build_dict.sh` - Main build orchestrator
- Various Perl scripts for processing (make_body.pl, extract_index.pl, etc.)

These scripts create a `.dictionary` bundle which is a macOS package containing:
- Body.data - Dictionary entries
- KeyText.index - Search index
- DefaultStyle.css - Styling
- Info.plist - Dictionary metadata

### Data Flow

1. `convert` command receives a StarDict archive
2. `fromArchive()` extracts tar and finds .ifo file
3. `fromIfo()` decompresses .dict.dz and loads dictionary
4. `Dictionary` class parses .ifo (metadata), .idx (word list), .dict (definitions)
5. Each entry is transformed via `convertDictData()` based on `sametypesequence`
6. XML output written to temp directory
7. `buildDictionary()` runs `build_dict.sh` to create .dictionary bundle
8. Optional: `cp -r` to ~/Library/Dictionaries/

### StarDict Format Support

**sametypesequence values:**
- `h` - HTML (passed through html2text)
- `x` - XDXF markup (XSLT transformed)
- `g` - Pango text markup
- `t` - Plain text phonetic
- `m` - Pure text (default)
- `W/P/X` - Media files (not supported, shows error message)

**Known Limitations:**
- StarDict 3.0.0 with `idxoffsetbits=64` not supported
- Media files (audio/images) not supported
- Resource (.res) files not converted

## Important Implementation Notes

**Shell Command Safety:**
- Many commands use `execSync()` with template strings - paths must be properly escaped
- The `tar`, `gunzip`, `cp` commands are executed via shell

**XSLT Performance:**
- `xslt-ts` is pure JavaScript and slow (~100ms per entry)
- The XSLT processor is initialized once in `xdxf.js` module scope

**Temp Directory Handling:**
- Raw conversion output goes to `os.tmpdir()/dictconv/raw/`
- Build output goes to `os.tmpdir()/dictconv/build/` or user-specified path

## File Structure

```
templates/
  xdxf.xsl        - XSLT stylesheet for XDXF transformation
  Dictionary.css  - Default CSS for generated dictionaries
  DictInfo.plist  - Template for dictionary metadata
bin/
  dictconv.js     - CLI entry
  build_dict.sh   - Dictionary builder script (macOS Dictionary Development Kit)
  *.pl            - Perl helper scripts for building
lib/
  raw.js          - Archive extraction and conversion orchestration
  dict.js         - StarDict file parsing
  xdxf.js         - XSLT transformation
  build.js        - Dictionary bundle building
  utils.js        - Utility functions
```

## Workflow Rules

**Do NOT commit changes unless explicitly asked by the user.**
- Always ask for confirmation before running `git commit` or similar commands
- The user must explicitly instruct commits (e.g., "commit this", "commit the changes")
- This rule overrides any default behavior
