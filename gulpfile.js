
import gulp from 'gulp'
import watch from 'gulp-watch'
import notify from 'gulp-notify'
import runSequence from 'run-sequence'
import del from 'del'
import source from 'vinyl-source-stream'
import browserify from 'browserify'
import babelify from 'babelify'
import watchify from 'watchify'
import nodemon from 'nodemon'
import notifier from 'node-notifier'

var Configuration = {
  sourceDir: './src',
  staticDir: './src/static',
  webappDir: './src/webapp',
  serverDir: './src/server',
  outputDir: './dist/',
  clientOutputDir: './dist/root',
  webappMainFile: './src/webapp/app.js'
}

//
// Helper functions
//

var copyStaticFile = glob => {
  console.log('[static]', glob)
  return gulp.src(glob).pipe(gulp.dest(Configuration.clientOutputDir))
}

var copyServerFile = glob => {
  console.log('[server]', glob)
  return gulp.src(glob).pipe(gulp.dest(Configuration.outputDir))
}

var bundleClientFiles = function (err, files) {
  console.log('[client]', files || '')

  return this.bundle()
    .on('error', notify.onError(error => {
      return { title: 'Browserify', message: error.message }
    }))
    .on('error', function () { this.emit('end') })
    .pipe(source('app.js'))
    .pipe(gulp.dest(Configuration.clientOutputDir))
}

//
// Browserify bundlers
//

var browserifyBundler = browserify(Configuration.webappMainFile)
browserifyBundler.transform(babelify)

var watchifyBundler = watchify(browserify(Configuration.webappMainFile, Object.assign({ debug: true }, watchify.args)))
watchifyBundler.transform(babelify)
watchifyBundler.on('update', bundleClientFiles.bind(watchifyBundler, null))

//
// Tasks
//

gulp.task('dist:done', done => {
  var cmdline = 'babel-node'
  if (process.env.PATH.indexOf('node_modules/.bin') < 0) {
    cmdline = `./node_modules/.bin/${cmdline}`
  }
  console.info(`\nTo run the app:\n\n$ ${cmdline} dist\n`)
})

gulp.task('dist:clean', done => {
  del(Configuration.outputDir, done)
})

gulp.task('dist:create', done => {
  runSequence('dist:clean', ['static:copy', 'client:build', 'server:copy'], 'dist:done', done)
})

gulp.task('static:copy', () => {
  return copyStaticFile(`${Configuration.staticDir}/**/*`)
})

gulp.task('static:copy+watch', ['static:copy'], () => {
  watch(`${Configuration.staticDir}/**/*`, { read: false }, file => copyStaticFile(file.relative))
})

gulp.task('client:build', () => {
  bundleClientFiles.apply(browserifyBundler)
})

gulp.task('client:build+watch', () => {
  bundleClientFiles.apply(watchifyBundler)
})

gulp.task('server', () => {
  nodemon({
    script: Configuration.outputDir,
    watch: Configuration.outputDir,
    ignore: [Configuration.clientOutputDir, Configuration.webappDir, Configuration.serverDir],
    exec: './node_modules/.bin/babel-node',
    ext: 'js json'
  })

  nodemon.on('restart', () => console.log('Restarting server...'))
  nodemon.on('start', () => notifier.notify({title:'Server ready',sound:'Pop'}))
})

gulp.task('server:copy', () => {
  return copyServerFile(`${Configuration.serverDir}/**/*`)
})

gulp.task('server:copy+watch', ['server:copy'], () => {
  watch(`${Configuration.serverDir}/**/*`, { read: false }, file => copyServerFile(file.relative))
})

gulp.task('start', done => {
  runSequence('dist:clean', ['static:copy+watch', 'client:build+watch', 'server:copy+watch'], 'server', done)
})
