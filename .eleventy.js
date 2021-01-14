// docs: https://www.11ty.io/docs/config/
const Nunjucks = require("nunjucks");
const yaml = require('js-yaml');
const MarkdownIt = require('markdown-it');
const materialColor = require('./material-color');

module.exports = eleventyConfig => {
  let njk = new Nunjucks.Environment(
      new Nunjucks.FileSystemLoader('app/'));
  njk.addFilter('material_color', input => {
    let parts = input.toLowerCase().split(/\s+/g);
    if (parts[0] == 'material' && parts.length >= 3) {
      return materialColor(parts[1], parts[2]);
    }
    return input;
  });

  eleventyConfig.setLibrary('njk', njk);

  eleventyConfig.addDataExtension('yaml', contents => {
    try {
      return yaml.load(contents);
    } catch (e) {
      console.error(e);
      return {};
    }
  });

  let md = new MarkdownIt();
  eleventyConfig.addPairedShortcode('markdown', content => {
    let html = md.render(content);
    return html;
  });

  return {
    templateFormats: ['njk'],
    dir: {
      data: 'data',
      includes: 'layouts',
      input: 'app',
      output: 'dist',
    }
  };
};