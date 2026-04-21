"""phase 1 scaffold

Revision ID: 0001_phase1
Revises: 
Create Date: 2026-04-20 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "0001_phase1"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)

    op.create_table(
        "projects",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("owner_id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("archived", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["owner_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_projects_owner_id"), "projects", ["owner_id"], unique=False)

    op.create_table(
        "raw_texts",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("project_id", sa.Uuid(), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("content_path", sa.String(length=500), nullable=False),
        sa.Column("media_type", sa.String(length=50), nullable=False),
        sa.Column("origin", sa.String(length=50), nullable=False),
        sa.Column("archived", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("content_path"),
    )
    op.create_index(op.f("ix_raw_texts_project_id"), "raw_texts", ["project_id"], unique=False)

    op.create_table(
        "drafts",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("project_id", sa.Uuid(), nullable=False),
        sa.Column("raw_text_id", sa.Uuid(), nullable=False),
        sa.Column("parent_draft_id", sa.Uuid(), nullable=True),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("branch_name", sa.String(length=120), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("content_path", sa.String(length=500), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("archived", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.ForeignKeyConstraint(["parent_draft_id"], ["drafts.id"]),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"]),
        sa.ForeignKeyConstraint(["raw_text_id"], ["raw_texts.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("content_path"),
    )
    op.create_index(op.f("ix_drafts_parent_draft_id"), "drafts", ["parent_draft_id"], unique=False)
    op.create_index(op.f("ix_drafts_project_id"), "drafts", ["project_id"], unique=False)
    op.create_index(op.f("ix_drafts_raw_text_id"), "drafts", ["raw_text_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_drafts_raw_text_id"), table_name="drafts")
    op.drop_index(op.f("ix_drafts_project_id"), table_name="drafts")
    op.drop_index(op.f("ix_drafts_parent_draft_id"), table_name="drafts")
    op.drop_table("drafts")
    op.drop_index(op.f("ix_raw_texts_project_id"), table_name="raw_texts")
    op.drop_table("raw_texts")
    op.drop_index(op.f("ix_projects_owner_id"), table_name="projects")
    op.drop_table("projects")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_table("users")
