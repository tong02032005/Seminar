"""page view – bảng PAGE_VIEW ghi lượt xem trang của khách (thống kê người dùng).

Revision ID: c4d2e8a1f705
Revises: b7c1f0a2d913
Create Date: 2026-11-11 13:45:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'c4d2e8a1f705'
down_revision: Union[str, Sequence[str], None] = 'b7c1f0a2d913'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'page_view',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('path', sa.String(length=200), nullable=False),
        sa.Column('visitorId', sa.String(length=64), nullable=False),
        sa.Column('createdAt', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_page_view')),
        sqlite_autoincrement=True,
    )
    op.create_index(op.f('ix_page_view_createdAt'), 'page_view', ['createdAt'])


def downgrade() -> None:
    op.drop_index(op.f('ix_page_view_createdAt'), table_name='page_view')
    op.drop_table('page_view')
