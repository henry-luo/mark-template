// karma.conf.js
module.exports = function(config) {
  config.set({
    frameworks: ['tape'],
    files: [
      'run/*.js'
    ],
	browsers : ['Chrome', 'Firefox'],
    reporters: ['tap'],
	//plugins : ['karma-tap','karma-tap-reporter'],
	failOnEmptyTestSuite: false
  })
}