// @ts-nocheck TS2564
import { Entity, PrimaryGeneratedColumn, Column, JoinColumn, ManyToOne } from "typeorm"
import { Term } from "./term"

@Entity({ name: "tags" })
export class Tag {
    @PrimaryGeneratedColumn()
    id: number

    @Column({
        type: "text",
        nullable: true
    })
    tag: string

    @ManyToOne(() => Term, (term) => term.videos, {createForeignKeyConstraints: false})
    @JoinColumn({ name: "term_id", referencedColumnName: "id" })
    term: Term
}