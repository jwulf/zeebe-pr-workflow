module.exports.two_daily = `<div>
    <p>
        ${event.daysOpen} ago, pull request {{event.number}} was opened in {{event.pull_request.base.repo.full_name}} by
        {{event.pull_request.head.user.login}}
    </p>
    <p>
        View the pull request at <a
            href="{{event.pull_request._links.html.href}}">{{event.pull_request._links.html.href}}</a>.
    </p>
</div>`;
