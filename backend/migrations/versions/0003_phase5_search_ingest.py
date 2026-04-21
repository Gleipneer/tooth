"""phase 5 fts, embeddings mirror, ingest review staging

Revision ID: 0003_phase5_search
Revises: 0002_ai_ops
Create Date: 2026-04-21 12:00:00.000000
"""

import sqlalchemy as sa
from alembic import op

revision = "0003_phase5_search"
down_revision = "0002_ai_ops"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("raw_texts", sa.Column("search_text", sa.Text(), nullable=True))
    op.add_column("raw_texts", sa.Column("embedding_json", sa.Text(), nullable=True))
    op.add_column("raw_texts", sa.Column("embedding_model", sa.String(length=80), nullable=True))
    op.execute(
        """
        CREATE INDEX ix_raw_texts_fts ON raw_texts USING gin(
            to_tsvector(
                'english',
                coalesce(title, '') || ' ' || coalesce(search_text, '')
            )
        )
        """
    )
    op.create_table(
        "ingest_review_items",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("project_id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="pending"),
        sa.Column("payload_json", sa.Text(), nullable=False, server_default="{}"),
        sa.Column("ai_operation_id", sa.Uuid(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["ai_operation_id"], ["ai_operations.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_ingest_review_items_project_id"), "ingest_review_items", ["project_id"], unique=False)
    op.create_index(op.f("ix_ingest_review_items_user_id"), "ingest_review_items", ["user_id"], unique=False)
    op.create_index(op.f("ix_ingest_review_items_status"), "ingest_review_items", ["status"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_ingest_review_items_status"), table_name="ingest_review_items")
    op.drop_index(op.f("ix_ingest_review_items_user_id"), table_name="ingest_review_items")
    op.drop_index(op.f("ix_ingest_review_items_project_id"), table_name="ingest_review_items")
    op.drop_table("ingest_review_items")
    op.execute("DROP INDEX IF EXISTS ix_raw_texts_fts")
    op.drop_column("raw_texts", "embedding_model")
    op.drop_column("raw_texts", "embedding_json")
    op.drop_column("raw_texts", "search_text")
