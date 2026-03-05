"""add layout_slots table

Revision ID: 1a58ad2bcaef
Revises: 49bab30078ca
Create Date: 2026-03-05 14:40:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1a58ad2bcaef'
down_revision: Union[str, None] = '49bab30078ca'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'layout_slots',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('stack_id', sa.Integer(), nullable=False),
        sa.Column('bin_type_id', sa.Integer(), nullable=False),
        sa.Column('orientation', sa.String(), nullable=True, server_default='updown'),
        sa.Column('offset_x', sa.Float(), nullable=True, server_default='0.5'),
        sa.Column('offset_y', sa.Float(), nullable=True, server_default='0.5'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['stack_id'], ['stacks.id']),
        sa.ForeignKeyConstraint(['bin_type_id'], ['bin_types.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_layout_slots_id'), 'layout_slots', ['id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_layout_slots_id'), table_name='layout_slots')
    op.drop_table('layout_slots')
