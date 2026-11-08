"""
SQLite database models for the Smart Tool Intelligence System.
Uses SQLAlchemy ORM with SQLite backend.
"""
from sqlalchemy import (
    create_engine, Column, Integer, String, Float, Text,
    DateTime, Boolean, ForeignKey
)
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
import datetime
import os
import json

DB_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
os.makedirs(DB_DIR, exist_ok=True)
DB_PATH = os.path.join(DB_DIR, "tool_intelligence.db")

engine = create_engine(f"sqlite:///{DB_PATH}", echo=False,
                       connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()


class CuttingTool(Base):
    __tablename__ = "cutting_tools"

    id = Column(Integer, primary_key=True, autoincrement=True)
    category = Column(String(100), nullable=False, index=True)
    subcategory = Column(String(100), default="")
    manufacturer = Column(String(100), default="Unknown")
    model_number = Column(String(100), default="")
    tool_material = Column(String(80), default="Solid Carbide")
    coating = Column(String(80), default="Uncoated")
    diameter_mm = Column(Float, default=0.0)
    num_flutes = Column(Integer, default=0)
    helix_angle = Column(Float, default=0.0)
    shank_diameter_mm = Column(Float, default=0.0)
    overall_length_mm = Column(Float, default=0.0)
    cutting_length_mm = Column(Float, default=0.0)
    # JSON-encoded lists
    compatible_materials = Column(Text, default="[]")
    compatible_operations = Column(Text, default="[]")
    # Cutting parameter ranges
    speed_range_min = Column(Float, default=0.0)
    speed_range_max = Column(Float, default=0.0)
    feed_range_min = Column(Float, default=0.0)
    feed_range_max = Column(Float, default=0.0)
    doc_range_min = Column(Float, default=0.0)
    doc_range_max = Column(Float, default=0.0)
    restrictions = Column(Text, default="")
    datasheet_url = Column(String(500), default="")
    image_path = Column(String(500), default="")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow,
                        onupdate=datetime.datetime.utcnow)

    assessments = relationship("ToolAssessment", back_populates="tool",
                               cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "category": self.category,
            "subcategory": self.subcategory,
            "manufacturer": self.manufacturer,
            "model_number": self.model_number,
            "tool_material": self.tool_material,
            "coating": self.coating,
            "diameter_mm": self.diameter_mm,
            "num_flutes": self.num_flutes,
            "helix_angle": self.helix_angle,
            "shank_diameter_mm": self.shank_diameter_mm,
            "overall_length_mm": self.overall_length_mm,
            "cutting_length_mm": self.cutting_length_mm,
            "compatible_materials": json.loads(self.compatible_materials or "[]"),
            "compatible_operations": json.loads(self.compatible_operations or "[]"),
            "speed_range_min": self.speed_range_min,
            "speed_range_max": self.speed_range_max,
            "feed_range_min": self.feed_range_min,
            "feed_range_max": self.feed_range_max,
            "doc_range_min": self.doc_range_min,
            "doc_range_max": self.doc_range_max,
            "restrictions": self.restrictions,
            "datasheet_url": self.datasheet_url,
            "image_path": self.image_path,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class ToolAssessment(Base):
    __tablename__ = "tool_assessments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    tool_id = Column(Integer, ForeignKey("cutting_tools.id"), nullable=True)
    assessment_type = Column(String(50), nullable=False)  # identification/inspection/wear/life
    predicted_vb = Column(Float, nullable=True)
    vb_unit = Column(String(10), default="mm")
    condition_category = Column(String(50), default="")
    confidence_score = Column(Float, default=0.0)
    visual_defects = Column(Text, default="[]")  # JSON
    remaining_life_ops = Column(Integer, nullable=True)
    remaining_life_minutes = Column(Float, nullable=True)
    sensor_data_used = Column(Text, default="{}")  # JSON
    image_path = Column(String(500), default="")
    report_path = Column(String(500), default="")
    notes = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    tool = relationship("CuttingTool", back_populates="assessments")

    def to_dict(self):
        return {
            "id": self.id,
            "tool_id": self.tool_id,
            "assessment_type": self.assessment_type,
            "predicted_vb": self.predicted_vb,
            "vb_unit": self.vb_unit,
            "condition_category": self.condition_category,
            "confidence_score": self.confidence_score,
            "visual_defects": json.loads(self.visual_defects or "[]"),
            "remaining_life_ops": self.remaining_life_ops,
            "remaining_life_minutes": self.remaining_life_minutes,
            "sensor_data_used": json.loads(self.sensor_data_used or "{}"),
            "image_path": self.image_path,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class OperationRecommendation(Base):
    __tablename__ = "operation_recommendations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    tool_id = Column(Integer, ForeignKey("cutting_tools.id"), nullable=True)
    assessment_id = Column(Integer, ForeignKey("tool_assessments.id"), nullable=True)
    operation_type = Column(String(100), nullable=False)
    suitability = Column(String(30), default="unknown")  # suitable/conditional/unsuitable
    reason = Column(Text, default="")
    workpiece_material = Column(String(100), default="")
    cutting_speed = Column(Float, nullable=True)
    feed_rate = Column(Float, nullable=True)
    depth_of_cut = Column(Float, nullable=True)
    warnings = Column(Text, default="[]")  # JSON
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "tool_id": self.tool_id,
            "assessment_id": self.assessment_id,
            "operation_type": self.operation_type,
            "suitability": self.suitability,
            "reason": self.reason,
            "workpiece_material": self.workpiece_material,
            "cutting_speed": self.cutting_speed,
            "feed_rate": self.feed_rate,
            "depth_of_cut": self.depth_of_cut,
            "warnings": json.loads(self.warnings or "[]"),
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


# Create tables
Base.metadata.create_all(engine)


def get_db():
    """FastAPI dependency for DB session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
