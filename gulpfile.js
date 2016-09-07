var gulp = require('gulp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var merge = require('merge-stream');
var ts = require('gulp-typescript');
var fs = require('fs');

// Read the contents of the tsconfig file so we dont have to specify the files twice
var tsConfig = JSON.parse(fs.readFileSync('tsconfig.json'));
var tsFiles = tsConfig.files;

// Config
var outDir = "dist";

/**
 * Checks to see that all TS files listed exist
 */
gulp.task('check-files', function() {

    // Make sure the files exist
    for (var i = 0, l = tsFiles.length; i < l; i++ )
        if(!fs.existsSync(tsFiles[i])) {
            console.log("File does not exist:" + tsFiles[i] );
            process.exit();
        }
})

/**
 * Concatenates and builds all TS code into a single file
 */
gulp.task('ts-code', function() {

    return gulp.src(tsFiles, { base: "." })
        .pipe(ts({
            "module": tsConfig.compilerOptions.module,
            "removeComments": tsConfig.compilerOptions.removeComments,
            "noEmitOnError": tsConfig.compilerOptions.noEmitOnError,
            "declaration": tsConfig.compilerOptions.declaration,
            "sourceMap": tsConfig.compilerOptions.sourceMap,
            "preserveConstEnums": tsConfig.compilerOptions.preserveConstEnums,
            "target": tsConfig.compilerOptions.target,
            "noImplicitAny": tsConfig.compilerOptions.noImplicitAny,
            "allowUnreachableCode": tsConfig.compilerOptions.allowUnreachableCode,
            "allowUnusedLabels": tsConfig.compilerOptions.allowUnusedLabels
            }))
        .pipe(gulp.dest(outDir + '/js'));
});

/**
 * Builds the definition
 */
gulp.task( 'ts-code-declaration', function() {

    let requiredDeclarationFiles = gulp.src([
        "./lib/definitions/custom/external-interfaces.d.ts"
    ], { base : "lib/definitions/custom"});

    let tsDefinition = gulp.src(tsFiles, { base: "." })
        .pipe(ts({
            "module": tsConfig.compilerOptions.module,
            "removeComments": false,
            "noEmitOnError": true,
            "declaration": true,
            "sourceMap": false,
            "preserveConstEnums": true,
            "target": tsConfig.compilerOptions.target,
            "noImplicitAny": tsConfig.compilerOptions.noImplicitAny,
            "allowUnreachableCode": tsConfig.compilerOptions.allowUnreachableCode,
            "allowUnusedLabels": tsConfig.compilerOptions.allowUnusedLabels,
            "out":"definitions.js"
        })).dts;

    // Merge the streams
    return merge( requiredDeclarationFiles, tsDefinition )
        .pipe( concat( "hatchery-runtime.d.ts" ) )
        .pipe( gulp.dest( "lib/definitions/generated" ) );
});

// TODO: Create release build
// /**
//  * Concatenates and builds all TS code into a single file
//  */
// gulp.task('ts-code-release', function() {

//     var jsFiles = tsProject.src()
//         .pipe(ts(tsProject))
//         .pipe(uglify())
//         .pipe(concat('application.js'))
//         .pipe(gulp.dest(outDir + '/js'));

//     // Add each css file in temp to the index in temp/index.html
//     return target.pipe( inject(jsFiles, {
//             starttag: '<!-- inject:js -->',
//             addRootSlash: false,
//             relative: true
//          }))
//         .pipe(gulp.dest(outDir + '/js'));
// });


gulp.task('build', ['ts-code', 'ts-code-declaration'] );