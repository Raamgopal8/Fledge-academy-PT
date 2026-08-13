from beanie import PydanticObjectId
from bson import ObjectId

obj = PydanticObjectId()
print("Original:", type(obj))
try:
    obj2 = PydanticObjectId(obj)
    print("Wrapped:", type(obj2))
except Exception as e:
    print("Error:", e)
