// export to build
var glob    = require('glob'),
    path    = require('path'),
    pkg     = require('./package.json');

module.exports = {
    BASE: __dirname,
    LIB: pkg.directories.lib,
    FILES: glob.sync(
        path.join(
            pkg.directories.lib,
            '**',
            '*.ctpl'
        ),
        {cwd: __dirname}
    )
};
