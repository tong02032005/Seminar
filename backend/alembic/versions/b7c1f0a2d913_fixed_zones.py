"""fixed zones – khu vực cố định: bỏ cột areaM2 (diện tích), bỏ "Khu mẫu" của bản cũ.

Admin không thêm/xóa khu nữa; 5 khu cố định do seed tạo (app/core/seed.py FIXED_ZONES).
CSDL cũ có thêm "Khu mẫu" (seed bản trước): xóa nếu khu đó không có động vật.

Revision ID: b7c1f0a2d913
Revises: e55cb57b86f9
Create Date: 2026-11-10 13:30:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'b7c1f0a2d913'
down_revision: Union[str, Sequence[str], None] = 'e55cb57b86f9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table('zone') as batch:
        batch.drop_constraint('ck_zone_area', type_='check')
        batch.drop_column('areaM2')
    op.execute(
        "DELETE FROM zone_content WHERE zoneId IN (SELECT zoneId FROM zone_content WHERE lang = 'vi' AND name = 'Khu mẫu') "
        "AND zoneId NOT IN (SELECT zoneId FROM animal)"
    )
    op.execute(
        "DELETE FROM zone WHERE id NOT IN (SELECT zoneId FROM zone_content) AND id NOT IN (SELECT zoneId FROM animal)"
    )


def downgrade() -> None:
    with op.batch_alter_table('zone') as batch:
        batch.add_column(sa.Column('areaM2', sa.Numeric(precision=10, scale=2), nullable=True))
        batch.create_check_constraint('ck_zone_area', 'areaM2 IS NULL OR areaM2 > 0')
