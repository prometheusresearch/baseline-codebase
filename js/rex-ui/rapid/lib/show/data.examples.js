/**
 * @flow
 */

import { type ASTNode } from "graphql/language/ast";

export const complexFragments = `
fragment User on User {
  code
  login
  email
  mobile_tn
  unverified_mobile_tn
  mobile_tn_status
  display_name
  locale
  timezone
}
fragment Shard on Shard {
  code
  display_name
  theme
}
fragment Consent on Consent {
  code
  display_name
  title
  subject { code display_name }
  study { code display_name }
  required
  handled
  status
  date_created
  date_accepted
  date_declined
}
fragment ConsentComplete on ConsentComplete {
  ...Consent
  body_html
  files {
    ...ConsentFile
  }
}
fragment ConsentFile on ConsentFile {
  code
  name
  size
  inline
}
fragment Message on Message {
  code
  status
  subject
  date_created
  date_delivered
  date_read
}
fragment MessageComplete on Message {
  ...Message
  body_text
  body_html
}
fragment Study on Study {
  code
  display_name
  enrollment_profile {
    code
    display_name
  }
  adhoc_tasks {
    code
    display_name
  }
}
fragment Report on Report {
  code
  status
  title
  date_created
  date_read
}
fragment ReportComplete on ReportComplete {
  ...Report
  files {
    ...ConsentFile
  }
}
fragment SubjectStudy on subject_study {
  study { code display_name }
  enrollments { ...Enrollment }
  invitations { ...Invitation }
}
fragment SubjectStudyComplete on subject_study {
  study { ...Study }
  enrollments { ...Enrollment }
  invitations { ...Invitation }
}
fragment SubjectCommon on Subject {
  code
  display_name
  display_id
  is_self
}
fragment Subject on Subject {
  ...SubjectCommon
  statistics {
    study
    task
    task_completed
    record
    record_completed
    consent
    consent_completed
  }
}
fragment SubjectComplete on Subject {
  ...SubjectCommon
  consents {
    ...Consent
  }
  records {
    ...Task
  }
  requests {
    ...Task
  }
  tasks {
    ...Task
  }
  studies {
    ...SubjectStudyComplete
  }
}
fragment Invitation on Invitation {
  code
  subject {
    code
    display_name
  }
  study {
    code
    display_name
  }
  status
  date_created
  date_responded
}
fragment InvitationComplete on Invitation {
  ...Invitation
  body_text
  body_html
  consents {
    ...EnrollmentConsent
  }
}
fragment Enrollment on Enrollment {
  code
  display_name
  subject { code display_name }
  study { code display_name }
  date_enrolled
  date_unenrolled
  is_active
}
fragment EnrollmentComplete on Enrollment {
  ...Enrollment
  invitation { code display_name }
}
fragment EnrollmentConsent on enrollment_consent {
  code
  title
  body_text
  body_html
  files { ...EnrollmentConsentFile }
}
fragment EnrollmentConsentFile on enrollment_consent_file {
  code
  name
  size
  inline
}
fragment Task on Task {
  code
  display_name
  subject { code display_name }
  handled
  status
  presentation_type
  date_created
  date_started
  date_completed
  consents_required
}
fragment TaskComplete on Task {
  ...Task
  consents { ...Consent }
  interaction
  instrument
  form
  parameters
  assessment
}
fragment ShardComplete on Shard {
  ...Shard
  features {
    showTasks
    showRecords
    showConsents
    showReports
    showMessages
    showRequests
    showStudies
    showSites
    showSubjects
    showIds
    showHandoff
    showAddStudy
    showAdHocTask
    showCreateSubject
  }
  state {
    unreadMessages
    unreadReports
    pendingRecords
    pendingTasks
    unrespondedInvitations
    unrespondedConsents
  }
  templates {
    home_content { title body }
  }
  sites {
    code
    display_name
  }
  studies {
    code
    display_name
    enrollment_profile {
      code
      display_name
    }
  }
  sms_enabled
  type
}
`;

export const complexQuery = `
    ${complexFragments}
    query(
      $shard: String!,
      $status: String,
      $study: String,
      $subject: String,
      $subjectId: subject_id!,
      $withSubject: Boolean!
    ) {
      shard(code: $shard) {
        subjects {
          get(id: $subjectId) @include(if: $withSubject) {
            code
            display_name
          }
        }
        subject_studies(
          status: $status,
          study: $study,
          subject: $subject
        ) {
          ...SubjectStudy
        }
      }
    }
    `;
