from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional, List
from beanie import PydanticObjectId

import models
from routes.auth import get_current_user

router = APIRouter()

class TransactionCreate(BaseModel):
    amount: float
    type: str # "income" or "expense"
    category: str
    description: Optional[str] = None
    student_id: Optional[PydanticObjectId] = None

class StudentFeeUpdate(BaseModel):
    total_fee: float

@router.get("")
async def get_finances(current_user: models.User = Depends(get_current_user)):
    if current_user.role != "ceo":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    transactions = await models.FinancialTransaction.find_all().to_list()
    
    total_income = sum(t.amount for t in transactions if t.type == "income")
    total_expense = sum(t.amount for t in transactions if t.type == "expense")
    balance = total_income - total_expense

    # Get student fee data
    students = await models.User.find(models.User.role == "student").to_list()
    student_fees = []
    
    for student in students:
        # Sum income transactions assigned to this student
        paid_amount = sum(t.amount for t in transactions if t.type == "income" and t.student_id == student.id)
        total_fee = student.total_fee or 0.0
        pending_amount = max(0.0, total_fee - paid_amount)
        
        student_fees.append({
            "id": str(student.id),
            "name": student.name or student.email,
            "email": student.email,
            "total_fee": total_fee,
            "paid_amount": paid_amount,
            "pending_amount": pending_amount
        })
    
    return {
        "transactions": transactions,
        "summary": {
            "total_income": total_income,
            "total_expense": total_expense,
            "balance": balance
        },
        "student_fees": student_fees
    }

@router.put("/student/{student_id}/fee")
async def update_student_fee(
    student_id: PydanticObjectId,
    fee_data: StudentFeeUpdate,
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "ceo":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        
    student = await models.User.get(student_id)
    if not student or student.role != "student":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
        
    student.total_fee = fee_data.total_fee
    await student.save()
    return {"message": "Student fee updated successfully"}

@router.post("")
async def add_transaction(
    transaction_data: TransactionCreate,
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "ceo":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        
    transaction = models.FinancialTransaction(**transaction_data.dict())
    await transaction.insert()
    return transaction

@router.post("/student/{student_id}/notify")
async def notify_student_fee(
    student_id: str,
    current_user: models.User = Depends(get_current_user)
):
    if (current_user.role or "").lower() not in ["ceo", "admin"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    student = None
    try:
        obj_id = PydanticObjectId(student_id)
        student = await models.User.get(obj_id)
    except Exception:
        pass

    if not student:
        student = await models.User.find_one({
            "$or": [
                {"_id": student_id},
                {"email": student_id},
                {"email": {"$regex": f"^{student_id}$", "$options": "i"}}
            ]
        })

    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

    transactions = await models.FinancialTransaction.find_all().to_list()
    paid_amount = sum(t.amount for t in transactions if t.type == "income" and (t.student_id == student.id or str(t.student_id) == str(student.id)))
    total_fee = student.total_fee or 0.0
    pending_amount = max(0.0, total_fee - paid_amount)

    reminder_msg = (
        f"Reminder from CEO: You have a pending fee balance of ₹{pending_amount:,.0f} "
        f"(Total Fee: ₹{total_fee:,.0f}, Paid: ₹{paid_amount:,.0f}). Please clear the dues soon."
    )

    reminder = models.StudentFeeReminder(
        student_id=str(student.id),
        student_name=student.name or student.email,
        student_email=student.email,
        total_fee=total_fee,
        paid_amount=paid_amount,
        pending_amount=pending_amount,
        message=reminder_msg,
        created_by="CEO"
    )
    await reminder.insert()

    return {
        "message": f"Fee reminder sent to {student.name or student.email}",
        "reminder_id": str(reminder.id),
        "pending_amount": pending_amount
    }

@router.get("/student/reminders")
async def get_student_fee_reminders(
    current_user: models.User = Depends(get_current_user)
):
    user_id_str = str(current_user.id)
    user_email = current_user.email

    reminders = await models.StudentFeeReminder.find({
        "$or": [
            {"student_id": user_id_str},
            {"student_email": user_email}
        ]
    }).sort("-created_at").to_list()

    return [
        {
            "id": str(r.id),
            "student_id": r.student_id,
            "student_name": r.student_name,
            "student_email": r.student_email,
            "total_fee": r.total_fee,
            "paid_amount": r.paid_amount,
            "pending_amount": r.pending_amount,
            "message": r.message,
            "created_by": r.created_by,
            "created_at": r.created_at.isoformat() if r.created_at else None,
            "is_read": r.is_read
        }
        for r in reminders
    ]

@router.delete("/{transaction_id}")
async def delete_transaction(
    transaction_id: PydanticObjectId,
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "ceo":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        
    transaction = await models.FinancialTransaction.get(transaction_id)
    if not transaction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")
        
    await transaction.delete()
    return {"message": "Transaction deleted successfully"}
