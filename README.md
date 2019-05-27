## webpack-config-tracker

- It output any input from bundle to a json file from webpack config

- I was using code from webpack-bundle-tracker:
   https://github.com/owais/webpack-bundle-tracker
   
- I modified it since I need to access different webpack attribute from backend and this can add automation.
- To use. Add following inside webpack.config.js

```
const ConfigTrackerPlugin = require("webpack-config-tracker");
...
module.exports = {
  ...
    plugins: [
      ...
        new ConfigTrackerPlugin({
          <any info>
          // outputFilename: XXX,
          // outputPath: XXX,
          // indent: XXX, 
        }),
      ...
    ]
  ...
}
```
