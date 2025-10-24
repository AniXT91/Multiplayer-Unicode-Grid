"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.serveStaticFile = serveStaticFile;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function serveStaticFile(req, res) {
    const basePath = path_1.default.join(__dirname, '..', '..', '..', 'client'); // go up 3 levels
    let pathname = req.url === '/' ? '/index.html' : req.url;
    const filePath = path_1.default.join(basePath, pathname);
    if (fs_1.default.existsSync(filePath)) {
        const ext = path_1.default.extname(filePath);
        const contentType = ext === '.html' ? 'text/html' :
            ext === '.js' ? 'text/javascript' :
                ext === '.css' ? 'text/css' : 'text/plain';
        res.writeHead(200, { 'Content-Type': contentType });
        fs_1.default.createReadStream(filePath).pipe(res);
    }
    else {
        res.writeHead(404);
        res.end('404 Not Found');
    }
}
