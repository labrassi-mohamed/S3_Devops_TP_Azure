"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const Q = require("q");
function run(connection) {
    var defer = Q.defer();
    connection.setDockerConfigEnvVariable();
    defer.resolve(null);
    return defer.promise;
}
exports.run = run;
