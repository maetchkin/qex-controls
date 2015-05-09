/* jshint node: true */
'use strict';

var through = require('through2'),
    gutil   = require('gulp-util'),
    path    = require('path'),
    indent  = '    ',

    getOffset = function(str){
        return str.match(/^(\s*)/)[0];
    },

    readBlock = function(code, num){
        var offset = getOffset(code[num]), _offset,
            read = true,
            block = {
                start: num, end: num,
                offset: offset,
                code: []
            };

        while( read && (block.end < code.length)){
            block.end++;
            _offset = getOffset( code[block.end] || '' );
            read =  _offset === code[block.end] || _offset.length > offset.length;
            read && _offset !== code[block.end] && block.code.push(code[block.end]);
        }

        return block;
    },

    decreaseIndent = function(length){
        return  function(str){
            return str.substr(length);
        };
    },

    blockTypeProcess = {
        'SHOW': function(block, blocks){
            block.show = block.code.map(decreaseIndent((block.offset + indent).length));
            block.code = [];
            blocks.push(block);
            codeWrap(block, ["div.i-example-code.sign-"+block.sign],[]);
        },
        'SUITE': function(block, blocks){
            blocks.push(block);
            codeWrap(block, [indent + "div.i-example-suite.sign-"+block.sign],[]);
        },
        'CODE': function(block, blocks){
            blocks.push(block);
            block.code.unshift('//block-start');
            block.code.push('//block-end');
            codeWrap(block, ["div.i-example-code.sign-"+block.sign],[]);
        },
        'TEST': function(block, blocks){
            blocks.push(block);
            codeWrap(
                block,
                [
                    "//block-end",
                    "JS",
                    indent + "tests['"+block.sign+"'] = function(" + ( block.opts.indexOf('ASYNC')!==-1 ? 'done' : '' ) + "){",
                    "//block-start",
                ],
                [
                    "//block-end",
                    indent + "}",
                    "div.i-example-test.sign-"+block.sign
                ]
            )
        },
    },

    codeWrap = function(block, header, footer){
        var result = [],
            offset = function(offset){return function(str){return str ? offset + str : str}},
            b_offset = offset(block.offset);
        result = result.concat(header.map(b_offset));
        result = result.concat(block.code.map(offset(indent)));
        result = result.concat(footer.map(b_offset));
        block.code = result;
    },

    getSign = function(){
        return (Math.random() + "").substr(2);
    },

    ctplReplace = function(code, blocks, name){
        var command, result = [],
            add = function(str){result.push(str)},
            block, num;
        if(code){
            for(num=0; num < code.length; num++){
                command = code[num].match(/\s*CTPL(?:-([A-Z]*))?\s?(.*)/);
                if(command){
                    block      = readBlock(code, num);
                    block.name = name;
                    block.type = command[1] || 'CODE';
                    block.opts = command[2] || null;
                    block.sign = getSign();
                    if(block.type in blockTypeProcess){
                        blockTypeProcess[block.type](block, blocks);
                        block.code = ctplReplace(block.code, blocks, name + ", " + block.opts);
                        block.code.forEach(add);
                        num = block.end-1;
                    } else {
                        var err = new Error();
                            err.message = block.type + " is unknown CTPL block type";
                        throw err;
                    }
                } else {
                    result.push(code[num]);
                }
            }
        }
        return result;
    },

    blocksPostProccess = function(_blocks){
        var blocks = [],
            clean  = function(block){
                delete  block.start;
                delete  block.end;
                delete  block.offset;
            };
        _blocks.forEach(
            function(block){
                if (block.type==='SUITE') {
                    delete block.code;
                    clean(block);
                    return;
                }

                if(block.type==='SHOW'){
                    block.type = 'CODE';
                    block.code = block.show;
                    delete block.show;
                    clean(block);
                    return;
                }
                var read = false,
                    code = [],
                    i, str;

                for(i in block.code){
                    str = block.code[i];
                    if( str.match(/block-end/) && i > 0 ){ break; }
                    if( read ){
                        code.push  (
                            decreaseIndent  (
                                                (block.offset + indent + indent).length
                                            )
                                            (
                                                str
                                            )
                                    );
                    }
                    read = read || !!str.match(/block-start/);
                }

                block.code = code;
                clean(block);
            }
        );

        return _blocks;
    },

    ctplProcess = function(file, ns){
        var parserPath  = path.join(process.cwd(), 'node_modules/conkitty/parser.js'),
            cParser     = require(parserPath).ConkittyParser,
            parser      = new cParser(file.path, String(file.contents)),
            blocks      = [],
            name        = path.basename(file.path, '.ctpl'),
            code        = ctplReplace(parser.src, blocks, name);

        //console.log("code", code);
        //console.log("blocks", blocks);

        blocks = blocksPostProccess(blocks);

        file.contents = new Buffer(code.join("\n"));
        return {
            code: blocks,
            name: name,
            file: file,
            block: true
        };
    };

var standPlugin = function(file, meta) {
    var ns = meta.ns || 'i::',
        scope  = {
            blocks: [],
            meta: meta
        },
        stream = through(
            {
                objectMode: true,
                allowHalfOpen: false
            },
            function (file, enc, cb) {
                var result = ctplProcess(file, ns);

                if (result.block) {

                    scope.blocks.push(
                        {
                            id:   result.name,
                            code: result.code
                        }
                    );
                } else if((result.name + '::') === ns){
                    scope.blocks.push(
                        {
                            id: result.name
                        }
                    );
                }

                scope.blocks =  scope.blocks.filter(
                                    function(elem){
                                        return elem.code.length > 0;
                                    }
                                );

                this.push(result.file);
                cb();
            },
            function (cb) {
                scope.blocks = scope.blocks
                                    .sort(
                                        function (a,b) {
                                            return a > b;
                                        }
                                    );
                this.push(
                    new gutil.File({
                        path: path.join(process.cwd(), file),
                        base: path.join(process.cwd(), path.dirname(file)),
                        cwd: process.cwd(),
                        contents: new Buffer(
                            JSON.stringify(scope, null, '  ')
                        )
                    })
                );

                cb();
            }
        );
    return stream;
};

module.exports = standPlugin;
