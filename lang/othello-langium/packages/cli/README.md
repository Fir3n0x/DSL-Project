# Othello CLI

A small CLI to generate ASCII output from Othello DSL files.

## Build

From the workspace root:

```
npm run build
```

This compiles the CLI into `out/` and wires the executable `bin/cli.js`.

## Usage

```
node ./bin/cli generate <file> [destination] [options]
```

Arguments:

- <file>: source Othello DSL file (extensions: as configured by the language)
- [destination]: optional destination file. If omitted, defaults to `<file>.ascii` in the same directory.

Options:

- -o, --out <path>  Output file or directory. If a directory, the file will be named `<file>.ascii`.
- --stdout          Print the generated ASCII to stdout instead of writing a file.

Examples:

```
# Write next to the source file
node ./bin/cli generate examples/variant1/variant1.othello

# Write to a specific file
node ./bin/cli generate examples/variant1/variant1.othello -o build/board.txt

# Write into a directory
node ./bin/cli generate examples/variant1/variant1.othello -o build/

# Print to console
node ./bin/cli generate examples/variant1/variant1.othello --stdout
```
