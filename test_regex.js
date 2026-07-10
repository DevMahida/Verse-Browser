const html1 = 'Here is the url: "https://lh3.googleusercontent.com/a/ACg8ocL\\u003ds96-c" inside JSON';
const html2 = 'Normal: "https://lh3.googleusercontent.com/a/ACg8ocL=s96-c"';
const html3 = 'Normal: "https://lh3.googleusercontent.com/a-/AOh14Gj=s96-c"';

const picRegex = /https:\/\/lh3\.googleusercontent\.com\/a[\/-][a-zA-Z0-9_/\-+=~.?&]+(?:\\u003d[a-zA-Z0-9\-_]+)?/;

let picMatch1 = html1.match(picRegex);
console.log("1:", picMatch1 ? picMatch1[0].replace(/\\u003d/g, '=') : null);

let picMatch2 = html2.match(picRegex);
console.log("2:", picMatch2 ? picMatch2[0].replace(/\\u003d/g, '=') : null);

let picMatch3 = html3.match(picRegex);
console.log("3:", picMatch3 ? picMatch3[0].replace(/\\u003d/g, '=') : null);
