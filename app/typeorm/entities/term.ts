// @ts-nocheck TS2564
import { Entity, PrimaryGeneratedColumn, Column, OneToOne, OneToMany } from "typeorm";
import { Memory } from "./memory";
import { Video } from "./video";
import { Tag } from "./tag";

@Entity({ name: "terms" })
export class Term {
    @PrimaryGeneratedColumn()
    id: number

    @Column({
        type: "text",
        nullable: false,
        default: ""
    })
    term: string

    @Column({
        type: "text",
        nullable: false,
        default: ""
    })
    note: string

    @Column({
        type: "text",
        nullable: false,
        default: "",
        name: "look_up"
    })
    lookUp: string

    @Column({
        type: "text",
        nullable: false,
        default: ""
    })
    pronounce: string

    @OneToMany(() => Video, (video) => video.term)
    videos: Video[]

    @OneToMany(() => Tag, (tag) => tag.term)
    tags: Tag[]

    @OneToOne(() => Memory, (memory) => memory.term)
    memory: Memory
}