"""ai operations audit

Revision ID: 0002_ai_ops
Revises: 0001_phase1
Create Date: 2026-04-21 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "0002_ai_ops"
down_revision = "0001_phase1"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "ai_operations",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("project_id", sa.Uuid(), nullable=False),
        sa.Column("draft_id", sa.Uuid(), nullable=True),
        sa.Column("task_class", sa.String(length=80), nullable=False),
        sa.Column("route_final", sa.String(length=40), nullable=False),
        sa.Column("escalated", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("cheap_rounds", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("models_used_json", sa.Text(), nullable=False, server_default="[]"),
        sa.Column("token_usage_json", sa.Text(), nullable=False, server_default="{}"),
        sa.Column("context_bundle_json", sa.Text(), nullable=False, server_default="{}"),
        sa.Column("response_json", sa.Text(), nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["draft_id"], ["drafts.id"]),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_ai_operations_user_id"), "ai_operations", ["user_id"], unique=False)
    op.create_index(op.f("ix_ai_operations_project_id"), "ai_operations", ["project_id"], unique=False)
    op.create_index(op.f("ix_ai_operations_draft_id"), "ai_operations", ["draft_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_ai_operations_draft_id"), table_name="ai_operations")
    op.drop_index(op.f("ix_ai_operations_project_id"), table_name="ai_operations")
    op.drop_index(op.f("ix_ai_operations_user_id"), table_name="ai_operations")
    op.drop_table("ai_operations")
