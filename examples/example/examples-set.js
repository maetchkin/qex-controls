'use strict';

window.ExamplesSet = Backbone.Collection.extend({
    'meta': {},
    'url': './blocks.json',
    'initialize': function(){
        this.on('render', this.startTests);
        this.initTests();
        this.fetch();
    },
    'initTests': function(){
        window.tests  = {};
        window.expect = chai.expect;
        window.mocha.setup({ui:'bdd'});
    },
    'startTests': function(){
        if (exampleState.params.runtest) {
            this.runAllTests();
        }
    },
    'parse': function(scope){
        this.meta = scope.meta;
        return scope.blocks;
    },
    'runAllTests': function(){
        // one
        var set = this;

        this.forEach(
            function(block){
                describe(
                    "Test block «" + block.id+"» \n    " + exampleState.params.framework +":"+ exampleState.params.$,
                    set.blockTestSuite(block)
                );
            }
        );

        if ('mochaPhantomJS' in window) {
            mochaPhantomJS.run();
        } else {
            mocha.run(
                set.trigger.bind(set, 'testsComplete')
            );
        }
    },

    'blockTestSuite': function(block){
        return function(){
            var blockTests = block.get('code').filter(
                    function(sub){
                        return sub.type === 'TEST';
                    }
                ),
                code = block.get('code').filter(
                    function(sub){
                        return sub.type === 'SUITE';
                    }
                );
            code.forEach(
                function(suite){
                    var sHead  = suite.name +", "+ suite.opts,
                        sTests = blockTests
                                    .filter(
                                        function(test){
                                            return test.name.indexOf(sHead)===0;
                                        }
                                    );
                    describe(
                        suite.opts,
                        function(){
                            sTests
                                .forEach(
                                    function(test){
                                        it(
                                            test.name + (test.opts ? " : " + test.opts : ""),
                                            tests[test.sign]
                                        )
                                    }
                                )
                        }
                    )
                }
            );
        }
    }
});

