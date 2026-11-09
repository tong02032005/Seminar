"""init seminar schema – migration GỐC của bản Seminar: tạo 13 bảng theo lược đồ đã chốt (schema.sql).

So với LTHD: bỏ REVIEW, ROLE; USER -> admin_account; zone_translation -> zone_content;
MAP_POINT -> poi (1–1 với animal, RESTRICT); MAP_POINT_TRANSLATION -> poi_content (thuyết minh + âm thanh);
system_settings bỏ autoApprove. Tên ràng buộc pk_/uq_/fk_ theo NAMING_CONVENTION, ck_ ghi tay trong model.

Revision ID: e55cb57b86f9
Revises: 
Create Date: 2026-11-09 15:37:37.825802

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e55cb57b86f9'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('admin_account',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('fullName', sa.String(length=100), nullable=False),
    sa.Column('email', sa.String(length=255), nullable=False),
    sa.Column('passwordHash', sa.String(length=255), nullable=False),
    sa.Column('passwordChangedAt', sa.DateTime(), nullable=True),
    sa.Column('createdAt', sa.DateTime(), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_admin_account')),
    sa.UniqueConstraint('email', name=op.f('uq_admin_account_email')),
    sqlite_autoincrement=True
    )
    op.create_table('category',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('code', sa.String(length=50), nullable=False),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_category')),
    sa.UniqueConstraint('code', name=op.f('uq_category_code')),
    sqlite_autoincrement=True
    )
    op.create_table('conservation_status',
    sa.Column('code', sa.String(length=2), nullable=False),
    sa.Column('color', sa.String(length=7), nullable=True),
    sa.CheckConstraint("code IN ('EX', 'EW', 'CR', 'EN', 'VU', 'NT', 'LC', 'DD', 'NE')", name='ck_conservation_status_code'),
    sa.CheckConstraint("color IS NULL OR (length(color) = 7 AND color GLOB '#[0-9A-Fa-f]*' AND substr(color, 2) NOT GLOB '*[^0-9A-Fa-f]*')", name='ck_conservation_status_color'),
    sa.PrimaryKeyConstraint('code', name=op.f('pk_conservation_status'))
    )
    op.create_table('language',
    sa.Column('code', sa.String(length=10), nullable=False),
    sa.Column('name', sa.String(length=50), nullable=False),
    sa.Column('isActive', sa.Boolean(), server_default=sa.text('1'), nullable=False),
    sa.CheckConstraint('isActive IN (0, 1)', name='ck_language_is_active'),
    sa.PrimaryKeyConstraint('code', name=op.f('pk_language'))
    )
    op.create_table('zone',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('color', sa.String(length=7), nullable=True),
    sa.Column('openHours', sa.String(length=50), nullable=True),
    sa.Column('areaM2', sa.Numeric(precision=10, scale=2), nullable=True),
    sa.Column('image', sa.String(length=255), nullable=True),
    sa.CheckConstraint("color IS NULL OR (length(color) = 7 AND substr(color, 1, 1) = '#' AND substr(color, 2) NOT GLOB '*[^0-9A-Fa-f]*')", name='ck_zone_color'),
    sa.CheckConstraint("openHours IS NULL OR (length(openHours) = 11 AND substr(openHours, 3, 1) = 'h' AND substr(openHours, 6, 1) = '-' AND substr(openHours, 9, 1) = 'h' AND substr(openHours, 1, 2) GLOB '[0-2][0-9]' AND CAST(substr(openHours, 1, 2) AS INTEGER) BETWEEN 0 AND 23 AND substr(openHours, 4, 2) GLOB '[0-5][0-9]' AND substr(openHours, 7, 2) GLOB '[0-2][0-9]' AND CAST(substr(openHours, 7, 2) AS INTEGER) BETWEEN 0 AND 23 AND substr(openHours, 10, 2) GLOB '[0-5][0-9]')", name='ck_zone_open_hours'),
    sa.CheckConstraint('areaM2 IS NULL OR areaM2 > 0', name='ck_zone_area'),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_zone')),
    sqlite_autoincrement=True
    )
    op.create_table('animal',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('scientificName', sa.String(length=150), nullable=False),
    sa.Column('zoneId', sa.Integer(), nullable=False),
    sa.Column('categoryId', sa.Integer(), nullable=False),
    sa.Column('conservationStatusCode', sa.String(length=2), nullable=False),
    sa.Column('available', sa.Boolean(), server_default=sa.text('1'), nullable=False),
    sa.Column('popularity', sa.Integer(), server_default=sa.text('0'), nullable=False),
    sa.Column('image', sa.Text(), server_default=sa.text('(NULL)'), nullable=True),
    sa.CheckConstraint('available IN (0, 1)', name='ck_animal_available'),
    sa.CheckConstraint('popularity >= 0', name='ck_animal_popularity'),
    sa.ForeignKeyConstraint(['categoryId'], ['category.id'], name=op.f('fk_animal_categoryId_category'), ondelete='RESTRICT'),
    sa.ForeignKeyConstraint(['conservationStatusCode'], ['conservation_status.code'], name=op.f('fk_animal_conservationStatusCode_conservation_status'), ondelete='RESTRICT'),
    sa.ForeignKeyConstraint(['zoneId'], ['zone.id'], name=op.f('fk_animal_zoneId_zone'), ondelete='RESTRICT'),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_animal')),
    sa.UniqueConstraint('scientificName', name=op.f('uq_animal_scientificName')),
    sqlite_autoincrement=True
    )
    op.create_table('category_translation',
    sa.Column('categoryId', sa.Integer(), nullable=False),
    sa.Column('lang', sa.String(length=10), nullable=False),
    sa.Column('name', sa.String(length=100), nullable=False),
    sa.ForeignKeyConstraint(['categoryId'], ['category.id'], name=op.f('fk_category_translation_categoryId_category'), ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['lang'], ['language.code'], name=op.f('fk_category_translation_lang_language'), ondelete='RESTRICT'),
    sa.PrimaryKeyConstraint('categoryId', 'lang', name=op.f('pk_category_translation')),
    sa.UniqueConstraint('lang', 'name', name='uq_category_translation_lang_name')
    )
    op.create_table('conservation_status_translation',
    sa.Column('statusCode', sa.String(length=2), nullable=False),
    sa.Column('lang', sa.String(length=10), nullable=False),
    sa.Column('name', sa.String(length=100), nullable=False),
    sa.Column('description', sa.Text(), nullable=True),
    sa.ForeignKeyConstraint(['lang'], ['language.code'], name=op.f('fk_conservation_status_translation_lang_language'), ondelete='RESTRICT'),
    sa.ForeignKeyConstraint(['statusCode'], ['conservation_status.code'], name=op.f('fk_conservation_status_translation_statusCode_conservation_status'), ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('statusCode', 'lang', name=op.f('pk_conservation_status_translation'))
    )
    op.create_table('system_settings',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('zooName', sa.String(length=100), nullable=False),
    sa.Column('openHours', sa.String(length=50), nullable=True),
    sa.Column('hotline', sa.String(length=20), nullable=True),
    sa.Column('defaultLang', sa.String(length=10), nullable=False),
    sa.CheckConstraint('id = 1', name='ck_system_settings_single_row'),
    sa.ForeignKeyConstraint(['defaultLang'], ['language.code'], name=op.f('fk_system_settings_defaultLang_language'), ondelete='RESTRICT'),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_system_settings'))
    )
    op.create_table('zone_content',
    sa.Column('zoneId', sa.Integer(), nullable=False),
    sa.Column('lang', sa.String(length=10), nullable=False),
    sa.Column('name', sa.String(length=100), nullable=False),
    sa.Column('description', sa.Text(), nullable=True),
    sa.ForeignKeyConstraint(['lang'], ['language.code'], name=op.f('fk_zone_content_lang_language'), ondelete='RESTRICT'),
    sa.ForeignKeyConstraint(['zoneId'], ['zone.id'], name=op.f('fk_zone_content_zoneId_zone'), ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('zoneId', 'lang', name=op.f('pk_zone_content')),
    sa.UniqueConstraint('lang', 'name', name='uq_zone_content_lang_name')
    )
    op.create_table('animal_translation',
    sa.Column('animalId', sa.Integer(), nullable=False),
    sa.Column('lang', sa.String(length=10), nullable=False),
    sa.Column('name', sa.String(length=100), nullable=False),
    sa.Column('appearance', sa.Text(), nullable=True),
    sa.Column('distribution', sa.Text(), nullable=True),
    sa.Column('ecology', sa.Text(), nullable=True),
    sa.Column('behaviour', sa.Text(), nullable=True),
    sa.Column('diet', sa.Text(), nullable=True),
    sa.Column('reproduction', sa.Text(), nullable=True),
    sa.Column('lifespan', sa.Text(), nullable=True),
    sa.Column('ecologicalRole', sa.Text(), nullable=True),
    sa.Column('threat', sa.Text(), nullable=True),
    sa.ForeignKeyConstraint(['animalId'], ['animal.id'], name=op.f('fk_animal_translation_animalId_animal'), ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['lang'], ['language.code'], name=op.f('fk_animal_translation_lang_language'), ondelete='RESTRICT'),
    sa.PrimaryKeyConstraint('animalId', 'lang', name=op.f('pk_animal_translation')),
    sa.UniqueConstraint('lang', 'name', name='uq_animal_translation_lang_name')
    )
    op.create_table('poi',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('animalId', sa.Integer(), nullable=False),
    sa.Column('icon', sa.String(length=100), nullable=True),
    sa.Column('latitude', sa.Numeric(precision=9, scale=4), nullable=False),
    sa.Column('longitude', sa.Numeric(precision=9, scale=4), nullable=False),
    sa.CheckConstraint('latitude BETWEEN -90 AND 90', name='ck_poi_latitude'),
    sa.CheckConstraint('longitude BETWEEN -180 AND 180', name='ck_poi_longitude'),
    sa.ForeignKeyConstraint(['animalId'], ['animal.id'], name=op.f('fk_poi_animalId_animal'), ondelete='RESTRICT'),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_poi')),
    sa.UniqueConstraint('animalId', name=op.f('uq_poi_animalId')),
    sqlite_autoincrement=True
    )
    op.create_table('poi_content',
    sa.Column('poiId', sa.Integer(), nullable=False),
    sa.Column('lang', sa.String(length=10), nullable=False),
    sa.Column('name', sa.String(length=100), nullable=False),
    sa.Column('direction', sa.Text(), nullable=True),
    sa.Column('narration', sa.Text(), nullable=True),
    sa.Column('narrationSource', sa.String(length=10), server_default=sa.text("'manual'"), nullable=False),
    sa.Column('audioFile', sa.String(length=255), nullable=True),
    sa.CheckConstraint("narrationSource IN ('manual', 'auto')", name='ck_poi_content_narration_source'),
    sa.ForeignKeyConstraint(['lang'], ['language.code'], name=op.f('fk_poi_content_lang_language'), ondelete='RESTRICT'),
    sa.ForeignKeyConstraint(['poiId'], ['poi.id'], name=op.f('fk_poi_content_poiId_poi'), ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('poiId', 'lang', name=op.f('pk_poi_content'))
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('poi_content')
    op.drop_table('poi')
    op.drop_table('animal_translation')
    op.drop_table('zone_content')
    op.drop_table('system_settings')
    op.drop_table('conservation_status_translation')
    op.drop_table('category_translation')
    op.drop_table('animal')
    op.drop_table('zone')
    op.drop_table('language')
    op.drop_table('conservation_status')
    op.drop_table('category')
    op.drop_table('admin_account')
