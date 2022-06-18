// @ts-nocheck TS2564
import { Entity, PrimaryGeneratedColumn, Column, JoinColumn, ManyToOne } from "typeorm"
import { Term } from "./term"

@Entity({ name: "videos" })
export class Video {
    @PrimaryGeneratedColumn()
    id: number

    @Column({
        type: "text",
        nullable: true
    })
    url: string

    @Column({
        type: "character",
        nullable: true
    })
    start: string

    @Column({
        type: "character",
        nullable: true
    })
    end: string

    @ManyToOne(() => Term, (term) => term.videos, {createForeignKeyConstraints: false})
    @JoinColumn({ name: "term_id", referencedColumnName: "id" })
    term: Term

    @Column({
        type: "integer",
        nullable: false
    })
    order: number
}