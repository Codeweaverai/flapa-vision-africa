
-- Add unique constraints to prevent conflicts for lesson_progress and course_progress tables

-- For lesson_progress table - ensure unique combination of enrollment_id and lesson_id
ALTER TABLE lesson_progress DROP CONSTRAINT IF EXISTS lesson_progress_enrollment_lesson_unique;
ALTER TABLE lesson_progress ADD CONSTRAINT lesson_progress_enrollment_lesson_unique 
UNIQUE (enrollment_id, lesson_id);

-- For course_progress table - ensure unique combination of user_id and course_id  
ALTER TABLE course_progress DROP CONSTRAINT IF EXISTS course_progress_user_course_unique;
ALTER TABLE course_progress ADD CONSTRAINT course_progress_user_course_unique 
UNIQUE (user_id, course_id);
