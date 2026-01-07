import { useEffect, useMemo, useState } from 'react'
import './App.css'

const STORAGE_KEY = 'college-erp-data'
const USER_KEY = 'college-erp-user'
const COURSE_FEE = 500

const seedData = {
  users: [
    {
      id: 'admin-1',
      name: 'Registrar',
      email: 'admin@college.edu',
      password: 'admin123',
      role: 'admin',
    },
    {
      id: 'stu-1001',
      name: 'Ananya Sharma',
      email: 'ananya@college.edu',
      password: 'student123',
      role: 'student',
    },
  ],
  students: [
    {
      id: 'stu-1001',
      userId: 'stu-1001',
      program: 'B.Tech CSE',
      year: '2',
      feesDue: 1500,
      courses: ['CS101', 'MA102'],
      payments: [{ amount: 500, date: '2024-12-01', method: 'UPI' }],
    },
  ],
  faculty: [
    {
      id: 'fac-1',
      name: 'Dr. Mehta',
      department: 'Computer Science',
      email: 'mehta@college.edu',
    },
    {
      id: 'fac-2',
      name: 'Prof. Rao',
      department: 'Mathematics',
      email: 'rao@college.edu',
    },
  ],
  courses: [
    {
      id: 'CS101',
      code: 'CS101',
      title: 'Data Structures',
      facultyId: 'fac-1',
      capacity: 30,
      schedule: [
        { day: 'Mon', time: '09:00-11:00', room: 'Lab 2' },
        { day: 'Wed', time: '10:00-11:00', room: 'Room 204' },
      ],
      enrolled: ['stu-1001'],
    },
    {
      id: 'MA102',
      code: 'MA102',
      title: 'Linear Algebra',
      facultyId: 'fac-2',
      capacity: 40,
      schedule: [{ day: 'Tue', time: '11:00-12:00', room: 'Room 201' }],
      enrolled: ['stu-1001'],
    },
    {
      id: 'HS103',
      code: 'HS103',
      title: 'Psychology Basics',
      facultyId: null,
      capacity: 50,
      schedule: [{ day: 'Thu', time: '14:00-15:00', room: 'Room 105' }],
      enrolled: [],
    },
  ],
}

const readStorage = () => {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) {
    try {
      return JSON.parse(saved)
    } catch (e) {
      console.warn('Falling back to defaults', e)
    }
  }
  return seedData
}

const readUser = () => {
  const saved = localStorage.getItem(USER_KEY)
  if (saved) {
    try {
      return JSON.parse(saved)
    } catch (e) {
      return null
    }
  }
  return null
}

const SectionTitle = ({ title, action }) => (
  <div className="section-title">
    <h3>{title}</h3>
    {action}
  </div>
)

const StatBadge = ({ label, value }) => (
  <div className="stat">
    <span className="stat-value">{value}</span>
    <span className="stat-label">{label}</span>
  </div>
)

const Input = ({ label, value, onChange, type = 'text', ...rest }) => (
  <label className="form-row">
    <span>{label}</span>
    <input value={value} onChange={(e) => onChange(e.target.value)} type={type} {...rest} />
  </label>
)

function App() {
  const [data, setData] = useState(readStorage)
  const [currentUser, setCurrentUser] = useState(readUser)
  const [authMode, setAuthMode] = useState('login')
  const [authError, setAuthError] = useState('')

  const [authForm, setAuthForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    program: 'B.Tech CSE',
    year: '1',
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [data])

  useEffect(() => {
    localStorage.setItem(USER_KEY, JSON.stringify(currentUser))
  }, [currentUser])

  const studentProfile = useMemo(() => {
    if (!currentUser || currentUser.role !== 'student') return null
    return data.students.find((s) => s.userId === currentUser.id) || null
  }, [currentUser, data.students])

  const facultyMap = useMemo(
    () =>
      data.faculty.reduce((acc, f) => {
        acc[f.id] = f
        return acc
      }, {}),
    [data.faculty],
  )

  const handleLogin = (e) => {
    e.preventDefault()
    const user = data.users.find(
      (u) => u.email.trim().toLowerCase() === authForm.email.trim().toLowerCase() && u.password === authForm.password,
    )
    if (!user) {
      setAuthError('Invalid email or password')
      return
    }
    setAuthError('')
    setCurrentUser(user)
  }

  const handleSignup = (e) => {
    e.preventDefault()
    const exists = data.users.some((u) => u.email.trim().toLowerCase() === authForm.email.trim().toLowerCase())
    if (exists) {
      setAuthError('An account with this email already exists')
      return
    }
    const idPrefix = authForm.role === 'student' ? 'stu' : 'admin'
    const newId = `${idPrefix}-${Date.now()}`
    const newUser = {
      id: newId,
      name: authForm.name || 'New User',
      email: authForm.email.trim().toLowerCase(),
      password: authForm.password,
      role: authForm.role,
    }

    const updates = { ...data, users: [...data.users, newUser] }
    if (authForm.role === 'student') {
      updates.students = [
        ...data.students,
        {
          id: newId,
          userId: newId,
          program: authForm.program,
          year: authForm.year,
          feesDue: 0,
          courses: [],
          payments: [],
        },
      ]
    }

    setData(updates)
    setCurrentUser(newUser)
    setAuthError('')
  }

  const logout = () => setCurrentUser(null)

  const handleAddCourse = (courseId) => {
    if (!studentProfile) return
    const course = data.courses.find((c) => c.id === courseId)
    if (!course) return
    if (course.enrolled.includes(studentProfile.id)) return
    if (course.enrolled.length >= course.capacity) {
      alert('Course capacity reached')
      return
    }

    const updatedCourses = data.courses.map((c) =>
      c.id === courseId ? { ...c, enrolled: [...c.enrolled, studentProfile.id] } : c,
    )
    const updatedStudents = data.students.map((s) =>
      s.id === studentProfile.id
        ? { ...s, courses: [...s.courses, courseId], feesDue: s.feesDue + COURSE_FEE }
        : s,
    )

    setData({ ...data, courses: updatedCourses, students: updatedStudents })
  }

  const handleDropCourse = (courseId) => {
    if (!studentProfile) return
    const updatedCourses = data.courses.map((c) =>
      c.id === courseId ? { ...c, enrolled: c.enrolled.filter((id) => id !== studentProfile.id) } : c,
    )
    const updatedStudents = data.students.map((s) =>
      s.id === studentProfile.id
        ? { ...s, courses: s.courses.filter((c) => c !== courseId), feesDue: Math.max(0, s.feesDue - COURSE_FEE) }
        : s,
    )

    setData({ ...data, courses: updatedCourses, students: updatedStudents })
  }

  const handlePayment = (amount, method) => {
    if (!studentProfile) return
    const parsed = Number(amount)
    if (!parsed || parsed <= 0) return
    const updatedStudents = data.students.map((s) =>
      s.id === studentProfile.id
        ? {
            ...s,
            feesDue: Math.max(0, s.feesDue - parsed),
            payments: [...s.payments, { amount: parsed, date: new Date().toISOString().slice(0, 10), method }],
          }
        : s,
    )
    setData({ ...data, students: updatedStudents })
  }

  const handleAddStudent = (payload) => {
    const exists = data.users.some((u) => u.email.trim().toLowerCase() === payload.email.trim().toLowerCase())
    if (exists) {
      alert('Email already exists')
      return
    }
    const id = `stu-${Date.now()}`
    const newUser = {
      id,
      name: payload.name,
      email: payload.email.trim().toLowerCase(),
      password: payload.password || 'welcome123',
      role: 'student',
    }
    setData({
      ...data,
      users: [...data.users, newUser],
      students: [
        ...data.students,
        {
          id,
          userId: id,
          program: payload.program,
          year: payload.year,
          feesDue: Number(payload.feesDue || 0),
          courses: [],
          payments: [],
        },
      ],
    })
  }

  const handleAddFaculty = (payload) => {
    const id = `fac-${Date.now()}`
    setData({
      ...data,
      faculty: [...data.faculty, { id, name: payload.name, department: payload.department, email: payload.email }],
    })
  }

  const parseSchedule = (text) =>
    text
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [day, time, room] = line.split('|').map((v) => v.trim())
        return { day: day || 'Day', time: time || 'Time', room: room || 'Room' }
      })

  const handleAddCourseAdmin = (payload) => {
    const exists = data.courses.some((c) => c.code.toLowerCase() === payload.code.toLowerCase())
    if (exists) {
      alert('Course code already exists')
      return
    }
    const schedule = parseSchedule(payload.schedule || '')
    const id = payload.code
    setData({
      ...data,
      courses: [
        ...data.courses,
        {
          id,
          code: payload.code,
          title: payload.title,
          facultyId: payload.facultyId || null,
          capacity: Number(payload.capacity || 30),
          schedule: schedule.length ? schedule : [{ day: 'TBD', time: 'TBD', room: 'TBD' }],
          enrolled: [],
        },
      ],
    })
  }

  const handleEnrollStudentToCourse = (studentId, courseId) => {
    const course = data.courses.find((c) => c.id === courseId)
    if (!course) {
      alert('Course not found')
      return
    }
    if (course.enrolled.includes(studentId)) {
      alert('Student already enrolled')
      return
    }
    if (course.enrolled.length >= course.capacity) {
      alert('Course capacity reached')
      return
    }
    const updatedCourses = data.courses.map((c) =>
      c.id === courseId ? { ...c, enrolled: [...c.enrolled, studentId] } : c,
    )
    const updatedStudents = data.students.map((s) =>
      s.id === studentId ? { ...s, courses: [...s.courses, courseId], feesDue: s.feesDue + COURSE_FEE } : s,
    )
    setData({ ...data, courses: updatedCourses, students: updatedStudents })
  }

  const handleFineStudent = (studentId, amount, note) => {
    const parsed = Number(amount)
    if (!parsed || parsed <= 0) {
      alert('Enter a valid fine amount')
      return
    }
    const updatedStudents = data.students.map((s) =>
      s.id === studentId ? { ...s, feesDue: s.feesDue + parsed } : s,
    )
    setData({ ...data, students: updatedStudents })
    if (note) {
      console.info('Fine note:', note)
    }
  }

  const availableCourses = useMemo(() => {
    if (!studentProfile) return []
    return data.courses.filter((c) => !studentProfile.courses.includes(c.id))
  }, [data.courses, studentProfile])

  const timetable = useMemo(() => {
    if (!studentProfile) return []
    const entries = studentProfile.courses
      .map((cid) => {
        const course = data.courses.find((c) => c.id === cid)
        if (!course) return []
        return course.schedule.map((slot) => ({
          ...slot,
          course: course.title,
          code: course.code,
        }))
      })
      .flat()
    return entries
  }, [studentProfile, data.courses])

  const renderAuth = () => (
    <div className="auth-card">
      <h2>College ERP</h2>
      <div className="auth-toggle">
        <button className={authMode === 'login' ? 'primary' : 'ghost'} onClick={() => setAuthMode('login')}>
          Login
        </button>
        <button className={authMode === 'signup' ? 'primary' : 'ghost'} onClick={() => setAuthMode('signup')}>
          Sign up
        </button>
      </div>
      <form className="auth-form" onSubmit={authMode === 'login' ? handleLogin : handleSignup}>
        {authMode === 'signup' && (
          <Input label="Full name" value={authForm.name} onChange={(v) => setAuthForm({ ...authForm, name: v })} />
        )}
        <Input label="Email" value={authForm.email} onChange={(v) => setAuthForm({ ...authForm, email: v })} type="email" required />
        <Input
          label="Password"
          value={authForm.password}
          onChange={(v) => setAuthForm({ ...authForm, password: v })}
          type="password"
          required
        />
        {authMode === 'signup' && (
          <>
            <label className="form-row">
              <span>Role</span>
              <select value={authForm.role} onChange={(e) => setAuthForm({ ...authForm, role: e.target.value })}>
                <option value="student">Student</option>
                <option value="admin">College Admin</option>
              </select>
            </label>
            {authForm.role === 'student' && (
              <>
                <Input
                  label="Program"
                  value={authForm.program}
                  onChange={(v) => setAuthForm({ ...authForm, program: v })}
                />
                <Input label="Year" value={authForm.year} onChange={(v) => setAuthForm({ ...authForm, year: v })} />
              </>
            )}
          </>
        )}
        {authError && <p className="error">{authError}</p>}
        <button type="submit" className="primary block">
          {authMode === 'login' ? 'Login' : 'Create account'}
        </button>
      </form>
      <p className="hint">
        Demo admin: admin@college.edu / admin123 <br />
        Demo student: ananya@college.edu / student123
      </p>
    </div>
  )

  return (
    <div className="page">
      <header className="topbar">
        <div>
          <p className="eyebrow">College ERP</p>
          <h1>Smart campus control center</h1>
        </div>
        {currentUser && (
          <div className="user-chip">
            <div>
              <strong>{currentUser.name}</strong>
              <p>{currentUser.email}</p>
            </div>
            <span className="badge">{currentUser.role}</span>
            <button className="ghost" onClick={logout}>
              Logout
            </button>
          </div>
        )}
      </header>

      {!currentUser && renderAuth()}

      {currentUser && currentUser.role === 'student' && studentProfile && (
        <StudentDashboard
          user={currentUser}
          student={studentProfile}
          data={data}
          facultyMap={facultyMap}
          onAddCourse={handleAddCourse}
          onDropCourse={handleDropCourse}
          onPay={handlePayment}
          availableCourses={availableCourses}
          timetable={timetable}
        />
      )}

      {currentUser && currentUser.role === 'admin' && (
        <AdminDashboard
          data={data}
          facultyMap={facultyMap}
          onAddStudent={handleAddStudent}
          onAddFaculty={handleAddFaculty}
          onAddCourse={handleAddCourseAdmin}
          onAddCourseToStudent={handleEnrollStudentToCourse}
          onFineStudent={handleFineStudent}
        />
      )}
    </div>
  )
}

const StudentDashboard = ({
  student,
  data,
  facultyMap,
  onAddCourse,
  onDropCourse,
  onPay,
  availableCourses,
  timetable,
}) => {
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('Card')

  return (
    <>
      <div className="grid three">
        <StatBadge label="Enrolled courses" value={student.courses.length} />
        <StatBadge label="Outstanding fees" value={`₹${student.feesDue}`} />
        <StatBadge label="Total payments" value={`₹${student.payments.reduce((a, p) => a + p.amount, 0)}`} />
      </div>

      <div className="grid two">
        <div className="card">
          <SectionTitle title="My courses" />
          {student.courses.length === 0 && <p className="muted">You are not enrolled yet.</p>}
          <div className="list">
            {student.courses.map((cid) => {
              const course = data.courses.find((c) => c.id === cid)
              if (!course) return null
              const faculty = course.facultyId ? facultyMap[course.facultyId] : null
              return (
                <div key={cid} className="item">
                  <div>
                    <p className="eyebrow">{course.code}</p>
                    <strong>{course.title}</strong>
                    <p className="muted">
                      {faculty ? `${faculty.name} • ${faculty.department}` : 'Faculty TBA'}
                    </p>
                  </div>
                  <button className="ghost" onClick={() => onDropCourse(cid)}>
                    Drop
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        <div className="card">
          <SectionTitle title="Available courses" />
          {availableCourses.length === 0 && <p className="muted">No more courses to add right now.</p>}
          <div className="list">
            {availableCourses.map((course) => (
              <div key={course.id} className="item">
                <div>
                  <p className="eyebrow">{course.code}</p>
                  <strong>{course.title}</strong>
                  <p className="muted">
                    Capacity {course.enrolled.length}/{course.capacity}
                  </p>
                </div>
                <button className="primary ghost" onClick={() => onAddCourse(course.id)}>
                  Add
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid two">
        <div className="card">
          <SectionTitle title="Timetable" />
          {timetable.length === 0 && <p className="muted">No sessions scheduled.</p>}
          <div className="schedule">
            {timetable.map((slot, idx) => (
              <div key={`${slot.day}-${idx}`} className="schedule-row">
                <span className="pill">{slot.day}</span>
                <div>
                  <strong>
                    {slot.course} ({slot.code})
                  </strong>
                  <p className="muted">
                    {slot.time} · {slot.room}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <SectionTitle title="Fees & payments" />
          <p className="muted">Pending amount: ₹{student.feesDue}</p>
          <div className="pay-box">
            <Input
              label="Amount"
              value={paymentAmount}
              type="number"
              onChange={setPaymentAmount}
              min={0}
              placeholder="Enter amount"
            />
            <label className="form-row">
              <span>Method</span>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                <option>Card</option>
                <option>UPI</option>
                <option>Netbanking</option>
                <option>Cash</option>
              </select>
            </label>
            <button
              className="primary block"
              onClick={() => {
                onPay(paymentAmount, paymentMethod)
                setPaymentAmount('')
              }}
            >
              Pay now
            </button>
          </div>
          <div className="list payments">
            {student.payments.map((p, idx) => (
              <div className="item" key={idx}>
                <div>
                  <strong>₹{p.amount}</strong>
                  <p className="muted">{p.date}</p>
                </div>
                <span className="pill grey">{p.method}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

const AdminDashboard = ({
  data,
  facultyMap,
  onAddStudent,
  onAddFaculty,
  onAddCourse,
  onAddCourseToStudent,
  onFineStudent,
}) => {
  const [studentForm, setStudentForm] = useState({
    name: '',
    email: '',
    program: '',
    year: '1',
    password: '',
    feesDue: 0,
  })
  const [facultyForm, setFacultyForm] = useState({ name: '', department: '', email: '' })
  const [courseForm, setCourseForm] = useState({
    code: '',
    title: '',
    capacity: 30,
    facultyId: '',
    schedule: 'Mon | 10:00-12:00 | Room 101',
  })
  const [assignForm, setAssignForm] = useState({ studentId: '', courseId: '' })
  const [fineForm, setFineForm] = useState({ studentId: '', amount: '', note: '' })

  return (
    <>
      <div className="grid three">
        <StatBadge label="Students" value={data.students.length} />
        <StatBadge label="Faculty" value={data.faculty.length} />
        <StatBadge label="Courses" value={data.courses.length} />
      </div>

      <div className="grid three">
        <div className="card">
          <SectionTitle title="Add student" />
          <Input label="Name" value={studentForm.name} onChange={(v) => setStudentForm({ ...studentForm, name: v })} />
          <Input
            label="Email"
            value={studentForm.email}
            onChange={(v) => setStudentForm({ ...studentForm, email: v })}
            type="email"
          />
          <Input
            label="Program"
            value={studentForm.program}
            onChange={(v) => setStudentForm({ ...studentForm, program: v })}
          />
          <Input label="Year" value={studentForm.year} onChange={(v) => setStudentForm({ ...studentForm, year: v })} />
          <Input
            label="Password"
            value={studentForm.password}
            onChange={(v) => setStudentForm({ ...studentForm, password: v })}
            type="password"
          />
          <Input
            label="Initial fees due"
            value={studentForm.feesDue}
            onChange={(v) => setStudentForm({ ...studentForm, feesDue: v })}
            type="number"
            min={0}
          />
          <button
            className="primary block"
            onClick={() => {
              onAddStudent(studentForm)
              setStudentForm({ name: '', email: '', program: '', year: '1', password: '', feesDue: 0 })
            }}
          >
            Add student
          </button>
        </div>

        <div className="card">
          <SectionTitle title="Add faculty" />
          <Input label="Name" value={facultyForm.name} onChange={(v) => setFacultyForm({ ...facultyForm, name: v })} />
          <Input
            label="Department"
            value={facultyForm.department}
            onChange={(v) => setFacultyForm({ ...facultyForm, department: v })}
          />
          <Input
            label="Email"
            value={facultyForm.email}
            onChange={(v) => setFacultyForm({ ...facultyForm, email: v })}
            type="email"
          />
          <button
            className="primary block"
            onClick={() => {
              onAddFaculty(facultyForm)
              setFacultyForm({ name: '', department: '', email: '' })
            }}
          >
            Add faculty
          </button>
        </div>

        <div className="card">
          <SectionTitle title="Create course" />
          <Input label="Code" value={courseForm.code} onChange={(v) => setCourseForm({ ...courseForm, code: v })} />
          <Input label="Title" value={courseForm.title} onChange={(v) => setCourseForm({ ...courseForm, title: v })} />
          <Input
            label="Capacity"
            type="number"
            min={1}
            value={courseForm.capacity}
            onChange={(v) => setCourseForm({ ...courseForm, capacity: v })}
          />
          <label className="form-row">
            <span>Faculty</span>
            <select value={courseForm.facultyId} onChange={(e) => setCourseForm({ ...courseForm, facultyId: e.target.value })}>
              <option value="">Unassigned</option>
              {data.faculty.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.department})
                </option>
              ))}
            </select>
          </label>
          <label className="form-row">
            <span>Schedule (one per line as Day | Time | Room)</span>
            <textarea
              rows={3}
              value={courseForm.schedule}
              onChange={(e) => setCourseForm({ ...courseForm, schedule: e.target.value })}
            />
          </label>
          <button
            className="primary block"
            onClick={() => {
              onAddCourse(courseForm)
              setCourseForm({ code: '', title: '', capacity: 30, facultyId: '', schedule: 'Mon | 10:00-12:00 | Room 101' })
            }}
          >
            Create course
          </button>
        </div>
      </div>

      <div className="grid two">
        <div className="card">
          <SectionTitle title="Students" />
          <div className="list">
            {data.students.map((s) => {
              const user = data.users.find((u) => u.id === s.id)
              return (
                <div className="item" key={s.id}>
                  <div>
                    <strong>{user?.name}</strong>
                    <p className="muted">
                      {s.program} • Year {s.year}
                    </p>
                  </div>
                  <span className="pill grey">Fees: ₹{s.feesDue}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="card">
          <SectionTitle title="Courses" />
          <div className="list">
            {data.courses.map((c) => (
              <div className="item" key={c.id}>
                <div>
                  <p className="eyebrow">{c.code}</p>
                  <strong>{c.title}</strong>
                  <p className="muted">
                    {c.schedule[0]?.day} {c.schedule[0]?.time} · {c.schedule[0]?.room}
                  </p>
                </div>
                <span className="pill">
                  {c.enrolled.length}/{c.capacity}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid two">
        <div className="card">
          <SectionTitle title="Assign course to student" />
          <label className="form-row">
            <span>Student</span>
            <select
              value={assignForm.studentId}
              onChange={(e) => setAssignForm({ ...assignForm, studentId: e.target.value })}
            >
              <option value="">Choose student</option>
              {data.students.map((s) => {
                const user = data.users.find((u) => u.id === s.id)
                return (
                  <option key={s.id} value={s.id}>
                    {user?.name} ({s.program})
                  </option>
                )
              })}
            </select>
          </label>
          <label className="form-row">
            <span>Course</span>
            <select
              value={assignForm.courseId}
              onChange={(e) => setAssignForm({ ...assignForm, courseId: e.target.value })}
            >
              <option value="">Choose course</option>
              {data.courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.title}
                </option>
              ))}
            </select>
          </label>
          <button
            className="primary block"
            onClick={() => {
              if (!assignForm.studentId || !assignForm.courseId) {
                alert('Select student and course')
                return
              }
              onAddCourseToStudent(assignForm.studentId, assignForm.courseId)
              setAssignForm({ studentId: '', courseId: '' })
            }}
          >
            Enroll student to course
          </button>
          <p className="muted">Adds course and increases fees by ₹{COURSE_FEE}.</p>
        </div>

        <div className="card">
          <SectionTitle title="Fine student" />
          <label className="form-row">
            <span>Student</span>
            <select
              value={fineForm.studentId}
              onChange={(e) => setFineForm({ ...fineForm, studentId: e.target.value })}
            >
              <option value="">Choose student</option>
              {data.students.map((s) => {
                const user = data.users.find((u) => u.id === s.id)
                return (
                  <option key={s.id} value={s.id}>
                    {user?.name} ({s.program})
                  </option>
                )
              })}
            </select>
          </label>
          <Input
            label="Fine amount (₹)"
            type="number"
            min={0}
            value={fineForm.amount}
            onChange={(v) => setFineForm({ ...fineForm, amount: v })}
          />
          <label className="form-row">
            <span>Reason (optional)</span>
            <textarea
              rows={2}
              value={fineForm.note}
              onChange={(e) => setFineForm({ ...fineForm, note: e.target.value })}
            />
          </label>
          <button
            className="ghost block"
            onClick={() => {
              if (!fineForm.studentId) {
                alert('Select a student')
                return
              }
              onFineStudent(fineForm.studentId, fineForm.amount, fineForm.note)
              setFineForm({ studentId: '', amount: '', note: '' })
            }}
          >
            Apply fine
          </button>
          <p className="muted">Adds the fine to the student’s outstanding fees.</p>
        </div>
      </div>

      <div className="grid two">
        <div className="card">
          <SectionTitle title="Faculty" />
          <div className="list">
            {data.faculty.map((f) => (
              <div className="item" key={f.id}>
                <div>
                  <strong>{f.name}</strong>
                  <p className="muted">{f.department}</p>
                </div>
                <span className="pill grey">{f.email}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <SectionTitle title="Recent payments" />
          <div className="list">
            {data.students
              .flatMap((s) =>
                s.payments.map((p) => ({
                  student: s.id,
                  ...p,
                })),
              )
              .slice(-6)
              .reverse()
              .map((p, idx) => {
                const user = data.users.find((u) => u.id === p.student)
                return (
                  <div className="item" key={idx}>
                    <div>
                      <strong>{user?.name || 'Student'}</strong>
                      <p className="muted">{p.date}</p>
                    </div>
                    <span className="pill">₹{p.amount}</span>
                  </div>
                )
              })}
          </div>
        </div>
      </div>
    </>
  )
}

export default App
