# backend/apps/ai/services.py

import json
from typing import Any, Dict, List

import openai
from django.conf import settings


class AIService:
    """AI service for question generation, grading, and analysis"""
    
    def __init__(self):
        self.client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = "gpt-3.5-turbo"
    
    def generate_questions(self, text: str, question_type: str, difficulty: str, count: int, **kwargs) -> List[Dict[str, Any]]:
        """Generate questions from text"""
        
        prompt = f"""
        Based on the following text, generate {count} {question_type} questions 
        with {difficulty} difficulty level.
        
        Text: {text[:4000]}
        
        Return as JSON:
        [
            {{
                "question_text": "question text",
                "question_type": "{question_type}",
                "difficulty": "{difficulty}",
                "options": ["option1", "option2", "option3", "option4"],
                "correct_answer": "correct answer",
                "explanation": "explanation of the answer",
                "marks": 10
            }}
        ]
        """
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert educational content creator."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                response_format={"type": "json_object"}
            )
            
            questions = json.loads(response.choices[0].message.content)
            return questions if isinstance(questions, list) else []
            
        except Exception as e:
            print(f"Error generating questions: {e}")
            return []
    
    def grade_descriptive_answer(self, question_text: str, expected_answer: str, student_answer: str, max_marks: int) -> Dict[str, Any]:
        """Grade a descriptive answer using AI"""
        
        prompt = f"""
        You are an expert teacher grading a student's answer.
        
        Question: {question_text}
        Expected Answer: {expected_answer}
        Student Answer: {student_answer}
        Maximum Marks: {max_marks}
        
        Analyze the student's answer and provide:
        1. Marks obtained (out of {max_marks})
        2. Feedback for improvement
        
        Return as JSON:
        {{
            "marks_obtained": marks,
            "feedback": "feedback text",
            "key_points_covered": ["point1", "point2"],
            "strengths": ["strength1", "strength2"],
            "areas_for_improvement": ["area1", "area2"]
        }}
        """
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert teacher."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                response_format={"type": "json_object"}
            )
            
            result = json.loads(response.choices[0].message.content)
            return result
            
        except Exception as e:
            print(f"Error grading answer: {e}")
            return {
                "marks_obtained": 0,
                "feedback": "Error in grading",
                "key_points_covered": [],
                "strengths": [],
                "areas_for_improvement": []
            }
    
    def analyze_student_performance(self, student_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze student performance and identify weak areas"""
        
        prompt = f"""
        Analyze the following student performance data and provide insights:
        
        Student Data: {json.dumps(student_data, indent=2)}
        
        Provide analysis including:
        1. Strong topics
        2. Weak topics
        3. Areas needing improvement
        4. Recommended actions
        5. Performance trends
        
        Return as JSON:
        {{
            "strong_topics": ["topic1", "topic2"],
            "weak_topics": ["topic1", "topic2"],
            "areas_for_improvement": ["area1", "area2"],
            "recommended_actions": ["action1", "action2"],
            "performance_trend": "improving/declining/stable",
            "overall_assessment": "assessment text",
            "needs_attention": true/false
        }}
        """
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an educational analytics expert."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                response_format={"type": "json_object"}
            )
            
            analysis = json.loads(response.choices[0].message.content)
            return analysis
            
        except Exception as e:
            print(f"Error analyzing performance: {e}")
            return {}
    
    def generate_practice_questions(self, weak_topics: List[str], difficulty: str = "medium") -> List[Dict[str, Any]]:
        """Generate personalized practice questions for weak topics"""
        
        prompt = f"""
        Generate practice questions for the following topics:
        {', '.join(weak_topics)}
        
        Difficulty level: {difficulty}
        
        Create 10 questions that help students practice and improve in these areas.
        Include a mix of MCQ and descriptive questions.
        
        Format as JSON:
        [
            {{
                "topic": "topic_name",
                "question_text": "question text",
                "question_type": "mcq or descriptive",
                "options": ["option1", "option2", "option3", "option4"],
                "correct_answer": "answer",
                "explanation": "detailed explanation",
                "difficulty": "{difficulty}",
                "marks": 10
            }}
        ]
        """
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an educational content creator."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                response_format={"type": "json_object"}
            )
            
            questions = json.loads(response.choices[0].message.content)
            return questions if isinstance(questions, list) else []
            
        except Exception as e:
            print(f"Error generating practice questions: {e}")
            return []