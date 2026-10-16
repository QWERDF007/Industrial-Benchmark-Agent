from typing import Optional
from pydantic import BaseModel, Field


class InspectionTask(BaseModel):
    task_id: str = Field(..., description="Unique inspection task ID")
    product: Optional[str] = Field(None, description="Product category or name")
    station: Optional[str] = Field(None, description="Station identifier")
    camera: Optional[str] = Field(None, description="Camera identifier")
    inspection_target: str = Field(..., description="Target defect / feature inspected")
    description: Optional[str] = Field(None, description="Task description")
