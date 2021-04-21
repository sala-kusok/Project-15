const source_folder = "#src";
const st = "scss"; // less

const gulp = require('gulp');
const sourceMaps = require('gulp-sourcemaps');
const del = require("del");
const browserSync = require('browser-sync').create();
const gulpIf = require("gulp-if");
const fileInclude = require("gulp-file-include");
const rename = require("gulp-rename");
const sass = require('gulp-sass');
// const less = require('gulp-less');
const plumber = require('gulp-plumber');
const autoprefixer = require('gulp-autoprefixer');
const cleanCss = require('gulp-clean-css');
const svgSprite = require("gulp-svg-sprite");
const svgmin = require("gulp-svgmin");
const cheerio = require("gulp-cheerio");
const replace = require("gulp-replace");
const imageMin = require("gulp-imagemin");
const webp = require('gulp-webp');
const ttf2woff = require('gulp-ttf2woff');
const ttf2woff2 = require('gulp-ttf2woff2');

//Массив путей
const config = {
    paths: {
        html: source_folder + '/html/*.html',
        style: source_folder + '/style/' + st + '/style.' + st,
        css: source_folder + '/style/css/**',
        js: source_folder + '/js/**',
        img: source_folder + '/images/*.{jpg,png,gif,svg,ico,webp}',
        raster: source_folder + '/images/raster/**/*.{jpg,png,gif,webp}',
        svg: source_folder + '/images/svg/**/*.svg',
        fonts: source_folder + '/fonts/*.ttf'
    },
    output: {
        path: 'build',
        pathJs: 'build/js',
        pathCss: 'build/css',
        pathImg: './build/img/',
        pathFonts: './build/fonts/'
    },
    watch: {
        html: source_folder + '/html/**/*.html',
        style: source_folder + '/style/' + st + '/**/*.' + st,
        css: source_folder + '/style/css/**/*.css',
        js: source_folder + '/js/**/*.js',
        img: source_folder + '/images/*.{jpg,png,gif,svg,ico,webp}',
        raster: source_folder + '/images/raster/**/*.{jpg,png,gif,webp}',
        svg: source_folder + '/images/svg/**/*.svg'
    },
    isDevelop: true // false
}

//Таск для обработки sass файлов
gulp.task('style', function () {
    return gulp.src(config.paths.style)
        .pipe(plumber())
        .pipe(gulpIf(config.isDevelop, sourceMaps.init()))
        .pipe(sass()) // less
        .pipe(
            autoprefixer({
                overrideBrowserslist: ["last 5 versions"],
                cascade: true
            })
        )
        .pipe(gulpIf(!config.isDevelop, cleanCss()))
        .pipe(gulpIf(config.isDevelop, sourceMaps.write()))
        .pipe(
            rename({
                extname: ".min.css"
            })
        )
        .pipe(gulp.dest(config.output.pathCss))
        .pipe(browserSync.reload({stream: true}));
});

//Таск для обработки css файлов
gulp.task('css', function () {
    return gulp.src(config.paths.css)
        .pipe(gulp.dest(config.output.pathCss))
        .pipe(browserSync.reload({stream: true}));
});

//Таск для обработки html файлов
gulp.task('html', function () {
    return gulp.src(config.paths.html)
        .pipe(fileInclude())
        .pipe(gulp.dest(config.output.path))
        .pipe(browserSync.reload({stream: true}));
});

//Таск для обработки js файлов
gulp.task('js', function () {
    return gulp.src(config.paths.js)
        .pipe(gulp.dest(config.output.pathJs))
        .pipe(browserSync.reload({stream: true}));
});

//Таск для обработки любой графики
gulp.task('img', function () {
    return gulp.src(config.paths.img)
        .pipe(
            imageMin([
                // imageMin.gifsicle({interlaced: true}),
                imageMin.mozjpeg({quality: 80, progressive: true}),
                // imageMin.optipng({optimizationLevel: 5})
            ])
        )
        .pipe(gulp.dest(config.output.pathImg))
        .pipe(browserSync.reload({stream: true}));
});

//Таск для обработки растровой графики
gulp.task('raster', function () {
    return gulp.src(config.paths.raster)
        .pipe(
            webp({
                quality: 80
            })
        )
        .pipe(gulp.dest(config.output.pathImg))
        .pipe(gulp.src(config.paths.raster))
        .pipe(
            imageMin([
                // imageMin.gifsicle({interlaced: true}),
                imageMin.mozjpeg({quality: 80, progressive: true}),
                // imageMin.optipng({optimizationLevel: 5})
            ])
        )
        .pipe(gulp.dest(config.output.pathImg))
        .pipe(browserSync.reload({stream: true}));
});

//Таск для обработки svg графики
gulp.task('svg', function () {
    return gulp.src(config.paths.svg)
        .pipe(svgmin({
            js2svg: {
                pretty: true
            }
        }))
        .pipe(cheerio({
            run: function ($) {
                $('[fill]').removeAttr('fill');
                $('[stroke]').removeAttr('stroke');
                $('[style]').removeAttr('style');
            },
            parserOptions: {xmlMode: true}
        }))
        .pipe(replace('&gt;', '>'))
        .pipe(svgSprite({
            mode: {
                symbol: {
                    sprite: "sprite.svg"
                }
            }
        }))
        .pipe(gulp.dest(config.output.pathImg));
});

//Таск для обработки шрифтов
gulp.task('fonts', function () {
    gulp.src(config.paths.fonts)
        .pipe(ttf2woff())
        .pipe(gulp.dest(config.output.pathFonts));
    return gulp.src(config.paths.fonts)
        .pipe(ttf2woff2())
        .pipe(gulp.dest(config.output.pathFonts));
});

//Таск для отслеживания изменений в файлах
gulp.task('serve', function () {
    browserSync.init({
        server: config.output.path
    });

    gulp.watch(config.watch.style, gulp.series('style'));
    gulp.watch(config.watch.html, gulp.series('html'));
    gulp.watch(config.watch.js, gulp.series('js'));
    gulp.watch(config.watch.css, gulp.series('css'));
    gulp.watch(config.paths.img, gulp.series('img'));
    gulp.watch(config.watch.svg, gulp.series('svg'));
    gulp.watch(config.watch.raster, gulp.series('raster'));
});

//Таск для очистки папки build
gulp.task('clean', function () {
    return del(config.output.path);
});

//Таск по умолчанию
gulp.task('default', gulp.series('clean', 'fonts', gulp.parallel('raster', 'svg', 'img'), gulp.parallel('css', 'js'), 'html', 'style', 'serve'));