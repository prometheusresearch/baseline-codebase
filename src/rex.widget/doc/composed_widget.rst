*******************************************
  Writing a Composed Widget
*******************************************

Rationale
=========

Real use-cases of using Rex Widget have proved that basic functionality and
configurability of widgets is not enough for creatring rich and functional
screens. Another issue with using the current approach is that amount of
configurational parameters grows very quickly and reduces the
maintainability. The flexibitlity of the `urlmap.yaml`-defined screens is
still very low and adding even a small feature to it may become quite
difficult task.

The solution for it is to let developer create the functional screen with as
much flexibility and functionality as needed. Rex Widget in this case should
make the life of the software developer as easy as possible: provide the
widget library, automate data loading, improve state management, while still
having the power of the `React.js`.


Getting Started
===============

Adding the composed widget is not different from adding any other widget. It
has the Python part::


    from rex.widget.widget import Widget
    from rex.widget import Field
    from rex.core import AnyVal, StrVal, IntVal, SeqVal

    ...

    class EnrollmentAdminPage(Widget):
        """ Enrollment admin page.
        """

        name = 'EnrollmentAdminPage'
        js_type = 'rex-study-enrollment-admin/lib/EnrollmentAdminPage'

        heading = Field(
            StrVal(),
            doc="""
            Heading.
            """)
    ...

And the JavaScript part::

    var React             = require('react/addons');
    var RexWidget         = require('rex-widget/lib/modern');

    var EnrollmentAdminPage = RexWidget.createWidgetClass({

        render() {
            ...
        }

    });

As you may see, the Python part is just the same us usual, whether JavaScript 
part has some differences. The first one is how you importing RexWidget. Make
sure to import from the *'rex-widget/lib/modern'*. The other difference is
how you create the widget class. Usually, we do `React.createClass`. Now to
get all helper mixins do the following: `RexWidget.createWidgetClass` instead.
The argument for this function is exactly the same as for the former statement.
I.e. this is basically common `React` component with all its methods and 
requirements. You can use all of `React` capabilities and restrictions inside 
of it.

Now when widget is defined, you can use it in the `urlmap.yaml` just as you
usually do. Here is the real-world example of using `EnrollmentAdminPage`::

    paths:

      /:
        widget: !<AppletPage>
          activity_root: enroll_participants
          title: Enroll Individuals from Call List
          children: !<EnrollmentAdminPage>
            heading: Search for Any Individual on the Call List

            study_list: rex.study.enrollment_admin:/data/study/list
            group_list: rex.study.enrollment_admin:/data/study/grouplist

            individual_list: rex.study.enrollment_admin:/data/individual/calllist
            individual: rex.study.recruitment_admin:/data/individualContent

            study_enrollment_list: rex.study.enrollment_admin:/data/individualenrolledin
            individual_list_columns:
            - key: code
              name: Code
            - key: identity.surname
              name: Last Name
            - key: identity.givenname
              name: First Name
            - key: identity.birthdate
              name: Birthdate

            remove_from_call_list: rex.study.enrollment_admin:/data/remove_call
            enroll_into_study: rex.study.enrollment_admin:/data/study_enrollment

            storage_link: rex.file:/
            download_link: rex.study.enrollment_admin:/data/consent
            participant_info_link: rex.study.enrollment_admin:/participants

            help_modal_title: Enrollment Help
            help_modal_text: |
              <p>On this page you can select and enroll individuals
              from your study call list.</p>
              <p>Begin by selecting the study call list you wish to
              view in the top center of the screen.</p>
              <p>Click on an individual in the list to the left
              and view their contact information on the right.</p>
              <p>To enroll them in the study, select <b> Enroll in Study </b>
              under the Options listed on the right side of the screen.
              A pop-up will open and you will be asked to provide the date
              of enrollment and have upload a copy of the
              individual's consent form.</p>
              <p>If the individual does not qualify or wish to participate, select
              <b> Remove from Call List </b> to remove them. A pop-up
              will open where you can confirm their removal from the call list.</p>
              <p>Go to <a href=../handbook target=
              "_blank">RexStudy Handbook</a> for full documentation on RexStudy.</p>


Database operations
===================

Let's see how you can work with database. All database opeartions are done.
using ports. It is wise to define the ports as configurational parameters. 
Here is how we modify the Python description of the widget to do it::

    from rex.widget.modern import CollectionSpecVal, EntitySpecVal, URLVal
    ...
    class EnrollmentAdminPage(Widget):

        ...

        study_list = Field(
            CollectionSpecVal(),
            doc="""
            Dataset for all available studies.
            """)

        group_list = Field(
            CollectionSpecVal(),
            doc="""
            Dataset for study groups.
            """)

        individual_list = Field(
            CollectionSpecVal(),
            doc="""
            Dataset for individual list.
            """)

        individual = Field(
            EntitySpecVal(),
            doc="""
            Dataset for individual.
            """)

        study_enrollment_list = Field(
            CollectionSpecVal(),
            doc="""
            Dataset for studies individual is enrolled in.
            """)

This is how you let your widget know about the fact that following properties
will accept ports. The only thing to underline here is the difference between
`EntitySpecVal` and `CollectionSpecVal`. You need to use former only in cases
when you know that 1 entity will be returned, i.e. you query some database
record/entity by its primary key. The latter should be used in all other
cases (i.e. you query the list of records which may have 0+ items).

So, while Python part is quite trivial, the JavaScript part is a bit more
complex and defines relationships between all those queries::

    var EnrollmentAdminPage = RexWidget.createWidgetClass({

      dataSpecs: {
        studyList: collection(),
        individualList: collection({
          'individual:studyval': state('selectedStudy', {required: true}),
          'individual:search': state('searchIndividual')
        }),
        individual: entity({
          'individual': state('selectedIndividual', {required: true})
        }),
        studyEnrollmentList: collection({
          'study_enrollment:ind': state('selectedIndividual', {required: true})
        }),
        groupList: collection({
          'participant_group.study': state('selectedStudy', {required: true})
        })
      },

      fetchDataSpecs: {
        studyList: true,
        individual: true,
        studyEnrollmentList: true
      },

      ...
    });

So, there is a `dataSpecs` widget attribute which corresponds to previously
defined widget propeties. This is the description of data properties and how
they are dependent on a page state. So the first one says::

    studyList: collection(),

which means: this is an independent collection of `study` objects.

The second one is more descriptive::

    individualList: collection({
      'individual:studyval': state('selectedStudy', {required: true}),
      'individual:search': state('searchIndividual')
    }),

`individualList` is a collection of individual objects which depends on the
page state. Specifically on 2 of page state variables: `selectedStudy` (and it
is required, i.e. set to non-null value before downloading the list of
individuals) and `searchIndividual` (which is not required and can be `null`).
Values of those variables should be passed to the port url as
`individual:studyval` and `individual:search` filters respectively when
obtaining the data. We'll consider the page state variables in the next chapter,
for now just think of them as usual `React` state variables which you can
access with `this.state.selectedStudy` or similar call.

Another important part to understand is how/when the data gets fetched?
The answer is: you have full control of it. The data is fetched after the widget
is rendered and `this.fetchDataSpecs.<data spec name>` is `true`. Specifically,
our top-most example widget fetchs 3 of 5 data specs initially::

  ...
  fetchDataSpecs: {
    studyList: true,
    individual: true,
    studyEnrollmentList: true
  },
  ...

Remaining 2 are been passed to children widget and fetched *only* in case those
widgets are rendered.

The last thing I want to stop on is how to access the data. Here is an 
example::

  /**
   * Select first study from the list.
   */
  selectFirstStudy() {
    if (this.data.studyList.data && this.data.studyList.data[0]) {
      this.state.selectedStudy.update(this.data.studyList.data[0].id);
    }
  },

So, everything defined in `dataSpec` appears as `this.data.*` at runtime. Each
of those data entities has 3 properties: `loading` (useful for showing the 
preloader), `data` or `value` (for collections or entities respectively) and 
`length`. Also there is one method which is specifically useful for 
collections::

    var study = data.studyList.findByID(state.selectedStudy.value);

It returns the needed object with all properties defined in the related port.
You can use `study.id` or `study.title` or anything else you're sure will be in
the object. This is specifically useful for page optimization and minimizing
the count of needed HTTP requests.


Using page state
=================

In the previous chapter we briefly stopped on using the page state variables
when fetching the data. This is very common, but not exclusive use of them.
There are many different situations when their use is needed (is modal dialog
open, is checkbox checked, which tab is selected etc).

Basically, React defines 2 types of variables which drive component behavior:
`props` (immutable set of component arguments) and `state` (mutable set of
variables which can be changed from inside component and drive its re-rendering).
We're completely following this paradigm, but adding one more set: `data`. The
set of data collections/entities received from the database. It acts much like
the `state` does (triggers re-rendering), but never modified directly from the
component code. And described using `dataSpecs` and `fetchDataSpecs` class
attributes.

Let's stop more on `state` this time::

  getInitialState() {
    return {
      searchIndividual: cell(null),
      selectedStudy: cell(null),
      selectedIndividual: cell(null),
      showHelpModal: cell(false),
      showRemoveModal: cell(false),
      showEnrollModal: cell(false)
    };
  }

This piece of code is very simple and likely femiliar to the most of developers
who use React. The only interesting part is is `cell`. Why it is used? What
benefits does it have? Basically, it is here for optimization reasons.
Components which react on state changes can subscribe to a specific state
variable and re-render only when this variable is updated. Another neat thing
is that you can update state granularly this way, i.e. instead of doing
`this.setState({x: value})` you can do `this.state.x.update(value)`. Also,
most of the widgets know about this interface and are using it. For example::

    <HelpModal
      title={props.helpModalTitle}
      text={props.helpModalText}
      open={state.showHelpModal}
      />

If `cell` is not used for `state.showHelpModal` this piece of code would look
as following::

    <HelpModal
      title={props.helpModalTitle}
      text={props.helpModalText}
      open={state.showHelpModal}
      onClose={(function() {this.setState({showHelpModal: false})}).bind(this)}
      />

Which is of course legitimate, but less obvious and more verbose.
`cell()` object provides the `value` property to directly read the value and
`update()` method to update it. If value is boolean you can also use
`cell.toggle()` helper for a true/false switching.


Using forms
===========

Let's consider real-world example together with forms usage overview. Here is
the task. We need a modal dialog with form, which will add the
`study_enrollment` record of 3 fields: date, consent (uploaded file) and
the participant_group. For participant group there may be one more groups, if
there is only one group we should not show the select box, but pre-set the
value automatically.

Here is the code::

    var EnrollModal = RexWidget.createWidgetClass({

      dataSpecs: {
        groupList: collection()
      },

      fetchDataSpecs: {
        groupList: true
      },

      formSchema: {
        type: 'object',
        properties: {
          study_enrollment: {
            type: 'array',
            items: {
              type: 'object',
              required: [
                'individual',
                'study',
                'consent_form_scan',
                'enrollment_date',
                'participant_group'
              ]
            }
          }
        }
      },

      render() {
        var {
          title, individual, study, open,
          enrollIntoStudy, onIndividualEnrolled,
          downloadLink, storageLink
        } = this.props;
        var submitButton = (
          <Button success icon="plus">Enroll</Button>
        );
        return (
          <Modal
            maxWidth="60%"
            maxHeight="80%"
            title="Enroll in Study"
            open={open}>
            <Form
              insert
              schema={this.formSchema}
              value={{
                study_enrollment: [{
                  individual: individual.id,
                  study: study.id
                }]
              }}
              submitTo={enrollIntoStudy}
              onSubmit={this.onSubmit}
              onSubmitComplete={onIndividualEnrolled}
              submitButton={submitButton}>
              <Info label="Study">{study.title}</Info>
              <Info label="Individual">{individual.name}</Info>
              <Fieldset selectFormValue="study_enrollment.0">
                <DatepickerField
                  label="Enrollment date"
                  selectFormValue="enrollment_date"
                  />
                {this.data.groupList.length > 1 &&
                  <SelectField
                    label="Group"
                    options={this.data.groupList.data}
                    selectFormValue="participant_group"
                    />}
                <FileUploadField
                  storage={storageLink}
                  download={downloadLink}
                  label="Upload Consent"
                  selectFormValue="consent_form_scan"
                  />
              </Fieldset>
            </Form>
          </Modal>
        );
      },

      onSubmit(value) {
        if (this.data.groupList.length === 1) {
          value = {
            study_enrollment: [{
              ...value.study_enrollment[0],
              participant_group: this.data.groupList.data[0].id
            }]
          };
        }
        return value;
      }
    });

So, the first interesting thing here is `dataSpec`. First of all it defines 
`groupList` as the collection with no dependencies in this component (while it
has the dependency in higher-level one). And also it will be fetched *only* 
after this component will be rendered. In other words, if user never opens
this modal dialog, `groupList`'s HTTP request will never be executed.

Now, if we look at the `render()` method we can see that this component renders
`<Modal>` with the `<Form>` inside. The `Form` constructor take certain
parameters:

 - `insert` says that form is going to act in insert mode (as opposed to 'update')

 - `schema` takes JSON schema (json-schema.org) which describes an object
   this form is going to produce

 - `value` is initial value to operate on

 - `submitButton` component which defines the submit button

 - `onSubmit` callback takes the value created using the form right before the
   submission. The value it returns will be submitted. If you need to do any
   modifications of the value, this is a right place to do it.

 - `onSubmitComplete` callback which is called when submission is successful

 - `submitTo` port where to submit

Also, in the `children` property of a `Form` you can see a some `Field` or
`Fieldset` components. The most important part of those is `selectFormValue`
property. It defines the path in the resulting object to take value from. 
`children` may contain any needed components/layout elements as needed by the 
form designer.


