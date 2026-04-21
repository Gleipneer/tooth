"""phase 6 books outline assignments

Revision ID: 0004_phase6_books
Revises: 0003_phase5_search
Create Date: 2026-04-21 22:00:00.000000
"""

import sqlalchemy as sa
from alembic import op

revision = "0004_phase6_books"
down_revision = "0003_phase5_search"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "books",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("project_id", sa.Uuid(), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("archived", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_books_project_id"), "books", ["project_id"], unique=False)

    op.create_table(
        "outline_nodes",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("book_id", sa.Uuid(), nullable=False),
        sa.Column("parent_id", sa.Uuid(), nullable=True),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["book_id"], ["books.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["parent_id"], ["outline_nodes.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_outline_nodes_book_id"), "outline_nodes", ["book_id"], unique=False)
    op.create_index(op.f("ix_outline_nodes_parent_id"), "outline_nodes", ["parent_id"], unique=False)

    op.create_table(
        "book_assignments",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("book_id", sa.Uuid(), nullable=False),
        sa.Column("outline_node_id", sa.Uuid(), nullable=False),
        sa.Column("raw_text_id", sa.Uuid(), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["book_id"], ["books.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["outline_node_id"], ["outline_nodes.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["raw_text_id"], ["raw_texts.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_book_assignments_book_id"), "book_assignments", ["book_id"], unique=False)
    op.create_index(
        op.f("ix_book_assignments_outline_node_id"),
        "book_assignments",
        ["outline_node_id"],
        unique=False,
    )
    op.create_index(op.f("ix_book_assignments_raw_text_id"), "book_assignments", ["raw_text_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_book_assignments_raw_text_id"), table_name="book_assignments")
    op.drop_index(op.f("ix_book_assignments_outline_node_id"), table_name="book_assignments")
    op.drop_index(op.f("ix_book_assignments_book_id"), table_name="book_assignments")
    op.drop_table("book_assignments")
    op.drop_index(op.f("ix_outline_nodes_parent_id"), table_name="outline_nodes")
    op.drop_index(op.f("ix_outline_nodes_book_id"), table_name="outline_nodes")
    op.drop_table("outline_nodes")
    op.drop_index(op.f("ix_books_project_id"), table_name="books")
    op.drop_table("books")
