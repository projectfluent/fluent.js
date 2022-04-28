import fs from "fs";

export function readfile(path) {
  return new Promise(function (resolve, reject) {
    fs.readFile(path, function (err, file) {
      return err ? reject(err) : resolve(file.toString());
    });
  });
}
