$("#alert-logout").click(function (e) {
    swal({
        title: "Are you sure you want to log out?",
        icon: "warning",
        buttons: {
            cancel: {
                value: false,
                visible: true,
                text: "Cancel",
                className: "btn btn-success",
            },
            confirm: {
                value: true,
                text: "Logout",
                className: "btn btn-danger",
            },
        },
    }).then((willLogout) => {
        if (willLogout) {
            // Gọi API logout bằng Axios
            axios.get('logout', {})
                .then(response => {
                    swal("Logged out successfully", {
                        icon: "success",
                        buttons: {
                            confirm: {
                                className: "btn btn-success",
                            },
                        },
                    }).then(() => {
                        window.location.href = "/admin/login";
                    });
                })
                .catch(error => {
                    console.error('Error:', error);
                    swal("Failed to log out!", {
                        buttons: {
                            confirm: {
                                className: "btn btn-danger",
                            },
                        },
                    });
                });
        } else {
            swal("Logout canceled!", {
                buttons: {
                    confirm: {
                        className: "btn btn-danger",
                    },
                },
            });
        }
    });
});