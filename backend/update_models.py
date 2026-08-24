import os

models_files = [
    "/home/raamgopal-s/Projects/fledgeportal/backend/announcement_service/models.py",
    "/home/raamgopal-s/Projects/fledgeportal/backend/community_service/models.py",
    "/home/raamgopal-s/Projects/fledgeportal/backend/test_service/models.py",
    "/home/raamgopal-s/Projects/fledgeportal/backend/core_service/models.py",
    "/home/raamgopal-s/Projects/fledgeportal/backend/class_activity_service/models.py",
    "/home/raamgopal-s/Projects/fledgeportal/backend/materials_service/models.py",
    "/home/raamgopal-s/Projects/fledgeportal/backend/attendance_service/models.py",
    "/home/raamgopal-s/Projects/fledgeportal/backend/video_service/models.py",
]

classes_to_update = ["ClassSchedule", "Announcement", "Material", "Test", "CommunityMessage", "Video", "User"]

for file in models_files:
    if not os.path.exists(file):
        continue
    with open(file, "r") as f:
        content = f.read()
        
    for cls in classes_to_update:
        if f"class {cls}(Document):" in content:
            # Check if it already has level
            class_start = content.find(f"class {cls}(Document):")
            # find next class or end of file
            class_end = content.find("class ", class_start + 1)
            if class_end == -1:
                class_end = len(content)
                
            class_body = content[class_start:class_end]
            if "level: Optional[str] = None" not in class_body and "level: str" not in class_body:
                # insert it
                insert_pos = content.find("\n", class_start) + 1
                content = content[:insert_pos] + "    level: Optional[str] = None\n" + content[insert_pos:]
                
    with open(file, "w") as f:
        f.write(content)
