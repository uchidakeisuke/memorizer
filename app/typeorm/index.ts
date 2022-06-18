import { app } from "electron";
import { join } from "path";
import { DataSource } from "typeorm";

import { Memory, Tag, Term, Video } from "./entities";

const dbName = "memorizer.db";
export const devDbPath = `./${dbName}`;
const dbPath = join(app.getPath("userData"), dbName);

export const dataSource = new DataSource({
    type: "sqlite",
    database: dbPath,
    synchronize: true,
    entities: [Term, Video, Tag, Memory],
    logging: false,
});
