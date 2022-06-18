// @ts-nocheck TS2564
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToOne,
    JoinColumn
} from "typeorm"
import { Term } from "./term"

@Entity({ name: "memories" })
export class Memory {
    @PrimaryGeneratedColumn()
    id: number

    @Column({
        type: "integer",
        nullable: false,
        default: 1
    })
    status: number

    @Column({
        type: "datetime",
        nullable: false,
        default: () => "CURRENT_TIMESTAMP"
    })
    suspend: Date

    @OneToOne(() => Term, (term) => term.memory)
    @JoinColumn({ name: "term_id", referencedColumnName: "id" })
    term: Term
}